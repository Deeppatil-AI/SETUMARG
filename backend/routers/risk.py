"""
Setumarg: Risk Router
Landslide Susceptibility & NASA LHASA-style Dynamic Rainfall Nowcasting Engine.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import copy

from backend.data.seed_ner_data import ROAD_SEGMENTS, RAINFALL_SCENARIOS
from backend.ml.train_risk_model import predict_susceptibility, get_model, batch_preload_susceptibility
from backend.services.weather_service import (
    get_weather_summary,
    get_current_weather,
    fetch_live_weather,
    get_weather_for_coordinate
)
from backend.services.historical_prediction import estimate_near_term_disruption

from datetime import datetime, timezone
import logging

logger = logging.getLogger("setumarg.risk")

# Vectorized one-time initialization (<50ms for all 415 segments)
batch_preload_susceptibility(ROAD_SEGMENTS)

router = APIRouter(prefix="/api/risk", tags=["Landslide Risk & Nowcasting"])

# Global state for dynamic rainfall scenario, scheduled auto-recompute, and crowdsourced hazard updates.
# DEFAULT mode on startup / page load is LIVE WEATHER, not a fixed 1.0x baseline.
CURRENT_RAINFALL_STATE = {
    "is_live_mode": True,
    "active_scenario_key": "live_weather",
    "custom_multiplier": 1.0,
    "rainfall_intensity_mm_hr": 0.0,
    "hazard_overrides": {}, # segment_id -> {status: "blocked", reported_severity: "Severe"}
    "last_recompute_time": None,
    "recompute_interval_seconds": 900
}

ALERT_TIER_COLORS = {
    "Low": "#10b981",       # Emerald
    "Moderate": "#eab308",  # Amber/Yellow
    "High": "#f97316",      # Orange
    "Very High": "#ef4444",  # Crimson/Red
    "Severe": "#991b1b"     # Dark Red
}


def compute_segment_dynamic_risk(seg: dict, rainfall_mult: float = None, overrides: dict = None, force_live: bool = False) -> dict:
    """
    Fuses static susceptibility (from scikit-learn RF model) with dynamic rainfall nowcast (LHASA pattern).
    When in live mode, derives the localized rainfall multiplier from real-time Open-Meteo observations and 24h forecast.
    """
    # 1. Static susceptibility inference
    static_result = predict_susceptibility(seg)
    static_score = static_result["static_risk_score"]

    # 2. Dynamic rainfall nowcast multiplier
    is_live = force_live or (
        CURRENT_RAINFALL_STATE.get("is_live_mode", True)
        and CURRENT_RAINFALL_STATE.get("active_scenario_key") == "live_weather"
        and rainfall_mult is None
    )

    live_meta = None
    if is_live:
        coords = seg.get("coordinates", [])
        mid_pt = coords[len(coords) // 2] if coords else [25.5, 92.0]
        w_rec = get_weather_for_coordinate(mid_pt[0], mid_pt[1])
        curr_rain = float(w_rec.get("current_rain_mm", 0.0) or 0.0)
        curr_precip = float(w_rec.get("current_precipitation_mm", 0.0) or 0.0)
        fc_24h = float(w_rec.get("forecast_next_24h_mm", 0.0) or 0.0)
        rain_rate = max(curr_rain, curr_precip)
        base_ref = float(seg.get("base_rainfall_mm", 55.0))
        fc_ratio = fc_24h / max(30.0, base_ref * 0.7)
        dynamic_multiplier = max(0.2, min(4.5, round(0.25 + (rain_rate / 15.0) * 0.75 + fc_ratio * 0.5, 2)))
        live_meta = {
            "is_live": True,
            "district": w_rec.get("district"),
            "current_rain_mm": curr_rain,
            "forecast_next_24h_mm": fc_24h,
            "weather_condition": w_rec.get("weather_description", "Monitored"),
            "source": w_rec.get("source", "Open-Meteo Live API")
        }
    else:
        dynamic_multiplier = max(0.2, rainfall_mult if rainfall_mult is not None else CURRENT_RAINFALL_STATE.get("custom_multiplier", 1.0))
        live_meta = {
            "is_live": False,
            "source": f"Manual Scenario Simulation ({CURRENT_RAINFALL_STATE.get('active_scenario_key', 'custom')})"
        }

    dynamic_score = min(1.0, static_score * (0.6 + 0.4 * dynamic_multiplier))

    # 3. Check for intrinsic or crowdsourced hazard override (pin-drop verification)
    is_blocked = bool(seg.get("is_blocked", False))
    blockage_reason = seg.get("blockage_reason")
    if overrides and seg["id"] in overrides:
        override = overrides[seg["id"]]
        if override.get("is_blocked"):
            is_blocked = True
            dynamic_score = max(dynamic_score, 0.92) # Push to Severe tier
            blockage_reason = override.get("description", "Crowdsourced landslide/blockage confirmed")

    # 4. Classify dynamic tier
    if dynamic_score < 0.28:
        tier = "Low"
    elif dynamic_score < 0.46:
        tier = "Moderate"
    elif dynamic_score < 0.65:
        tier = "High"
    elif dynamic_score < 0.82:
        tier = "Very High"
    else:
        tier = "Severe"

    color = ALERT_TIER_COLORS[tier]

    top_drivers = list(static_result["top_drivers"])
    if is_live and live_meta and (live_meta.get("current_rain_mm", 0) > 0 or live_meta.get("forecast_next_24h_mm", 0) > 15):
        top_drivers.insert(0, f"Live rainfall: {live_meta['weather_condition']} ({live_meta['current_rain_mm']}mm/hr, {live_meta['forecast_next_24h_mm']}mm 24h fc)")

    # 5. Historical pattern-informed disruption likelihood (next 24-48 hours)
    disruption_profile = estimate_near_term_disruption(
        seg=seg,
        live_weather=live_meta if (is_live and live_meta) else {"forecast_next_24h_mm": 20.0 * dynamic_multiplier, "current_rain_mm": 4.0 * dynamic_multiplier},
        dynamic_multiplier=dynamic_multiplier,
        is_blocked=is_blocked,
        static_score=static_score
    )

    return {
        "segment_id": seg["id"],
        "highway": seg["highway"],
        "name": seg["name"],
        "state": seg["state"],
        "coordinates": seg["coordinates"],
        "length_km": seg["length_km"],
        "elevation_m": seg["elevation_m"],
        "static_susceptibility_class": static_result["class_name"],
        "static_risk_score": static_score,
        "dynamic_alert_tier": tier,
        "dynamic_risk_score": round(dynamic_score, 3),
        "dynamic_multiplier": dynamic_multiplier,
        "live_weather": live_meta,
        "disruption_likelihood_pct": disruption_profile["disruption_likelihood_pct"],
        "disruption_prediction_text": disruption_profile["disruption_prediction_text"],
        "disruption_risk_level": disruption_profile["disruption_risk_level"],
        "historical_incident_profile": disruption_profile,
        "color": color,
        "is_blocked": is_blocked,
        "blockage_reason": blockage_reason,
        "top_drivers": top_drivers,
        "primary_hazard": seg["primary_hazard"],
        "strategic_importance": seg["strategic_importance"],
        "factors": {
            "slope_deg": seg["slope_deg"],
            "aspect_deg": seg["aspect_deg"],
            "plan_curvature": seg["plan_curvature"],
            "profile_curvature": seg["profile_curvature"],
            "dist_to_drainage_m": seg["dist_to_drainage_m"],
            "dist_to_fault_m": seg["dist_to_fault_m"],
            "dist_to_road_m": seg["dist_to_road_m"],
            "ndvi": seg["ndvi"],
            "lulc_class": seg["lulc_class"],
            "lithology_class": seg["lithology_class"],
            "soil_texture": seg["soil_texture"],
            "base_rainfall_mm": seg["base_rainfall_mm"]
        }
    }


def recompute_live_risks() -> dict:
    """
    Fetches real-time weather and updates live meteorological indicators and dynamic risk state.
    """
    fetch_live_weather()
    summary = get_weather_summary()
    now_utc = datetime.now(timezone.utc).isoformat()

    CURRENT_RAINFALL_STATE["last_recompute_time"] = now_utc
    CURRENT_RAINFALL_STATE["rainfall_intensity_mm_hr"] = summary.get("regional_average_current_rain_mm", 0.0)

    # Calculate average live multiplier across all segments
    seg_multipliers = []
    for s in ROAD_SEGMENTS:
        coords = s.get("coordinates", [])
        mid = coords[len(coords) // 2] if coords else [25.5, 92.0]
        w = get_weather_for_coordinate(mid[0], mid[1])
        r = max(float(w.get("current_rain_mm", 0.0) or 0.0), float(w.get("current_precipitation_mm", 0.0) or 0.0))
        fc24 = float(w.get("forecast_next_24h_mm", 0.0) or 0.0)
        base = float(s.get("base_rainfall_mm", 55.0))
        m = max(0.2, min(4.5, round(0.25 + (r / 15.0) * 0.75 + (fc24 / max(30.0, base * 0.7)) * 0.5, 2)))
        seg_multipliers.append(m)

    avg_mult = round(sum(seg_multipliers) / len(seg_multipliers), 2) if seg_multipliers else 1.0
    CURRENT_RAINFALL_STATE["custom_multiplier"] = avg_mult

    logger.info(f"Recomputed live risk state at {now_utc}: regional avg multiplier {avg_mult}x")
    return get_all_road_segments()


class NowcastUpdateRequest(BaseModel):
    scenario_key: Optional[str] = None
    custom_multiplier: Optional[float] = None
    rainfall_intensity_mm_hr: Optional[float] = None


@router.get("/segments")
def get_all_road_segments():
    """
    Returns all monitored NER road segments with live fused dynamic risk calculations.
    DEFAULT mode reflects real, current Open-Meteo conditions rather than a fixed baseline.
    """
    is_live = (
        CURRENT_RAINFALL_STATE.get("is_live_mode", True)
        and CURRENT_RAINFALL_STATE.get("active_scenario_key") == "live_weather"
    )
    mult = CURRENT_RAINFALL_STATE["custom_multiplier"] if not is_live else None
    overrides = CURRENT_RAINFALL_STATE["hazard_overrides"]

    scored_segments = []
    tier_counts = {"Low": 0, "Moderate": 0, "High": 0, "Very High": 0, "Severe": 0}
    blocked_count = 0

    for seg in ROAD_SEGMENTS:
        item = compute_segment_dynamic_risk(seg, mult, overrides)
        tier_counts[item["dynamic_alert_tier"]] += 1
        if item["is_blocked"]:
            blocked_count += 1
        scored_segments.append(item)

    weather_summary = get_weather_summary()

    return {
        "is_live_mode": is_live,
        "current_scenario": CURRENT_RAINFALL_STATE["active_scenario_key"],
        "current_multiplier": CURRENT_RAINFALL_STATE["custom_multiplier"],
        "current_rainfall_intensity": CURRENT_RAINFALL_STATE["rainfall_intensity_mm_hr"],
        "live_weather_source": weather_summary.get("source", "Open-Meteo Live API") if is_live else "Manual Scenario Simulation",
        "last_recompute_time": CURRENT_RAINFALL_STATE.get("last_recompute_time") or weather_summary.get("timestamp"),
        "tier_summary": tier_counts,
        "blocked_segments_count": blocked_count,
        "total_monitored_km": sum(s["length_km"] for s in scored_segments),
        "segments": scored_segments
    }


@router.get("/segment/{segment_id}")
def get_segment_detail(segment_id: str):
    """
    Retrieves deep geotechnical factor breakdown and explainable AI diagnostic for a specific segment.
    """
    seg = next((s for s in ROAD_SEGMENTS if s["id"] == segment_id), None)
    if not seg:
        raise HTTPException(status_code=404, detail=f"Segment {segment_id} not found.")

    is_live = (
        CURRENT_RAINFALL_STATE.get("is_live_mode", True)
        and CURRENT_RAINFALL_STATE.get("active_scenario_key") == "live_weather"
    )
    mult = CURRENT_RAINFALL_STATE["custom_multiplier"] if not is_live else None
    overrides = CURRENT_RAINFALL_STATE["hazard_overrides"]
    result = compute_segment_dynamic_risk(seg, mult, overrides)

    # Add geotechnical narrative
    if is_live and result.get("live_weather", {}).get("is_live"):
        lw = result["live_weather"]
        explanation = (
            f"Segment {seg['name']} on {seg['highway']} is classified as '{result['dynamic_alert_tier']}' risk. "
            f"Slope inclination is {seg['slope_deg']}° (aspect {seg['aspect_deg']}°) with proximity to geological fault lines at {seg['dist_to_fault_m']}m. "
            f"Real-time meteorological monitoring via Open-Meteo at {lw.get('district')} shows {lw.get('weather_condition')} with "
            f"{lw.get('current_rain_mm')} mm/hr precipitation and {lw.get('forecast_next_24h_mm')} mm short-term 24h accumulation, "
            f"yielding a localized dynamic hazard multiplier of {result['dynamic_multiplier']:.2f}x."
        )
    else:
        explanation = (
            f"Segment {seg['name']} on {seg['highway']} is classified as '{result['dynamic_alert_tier']}' risk. "
            f"The slope inclination is {seg['slope_deg']}° with a distance of {seg['dist_to_fault_m']}m to tectonic thrust lineaments. "
            f"Scenario simulation multiplier ({result['dynamic_multiplier']:.1f}x) combines with the baseline precipitation of {seg['base_rainfall_mm']}mm "
            f"to elevate pore-water pressure along shear planes."
        )
    pred_text = result.get("disruption_prediction_text", "")
    if pred_text:
        explanation += f" {pred_text}"
    result["plain_language_explanation"] = explanation

    return result


@router.post("/nowcast")
def update_nowcast_scenario(payload: NowcastUpdateRequest):
    """
    Scrubber endpoint: Updates live rainfall conditions and recalculates regional risk nowcasts immediately.
    Supports resetting to live weather as well as simulating extreme scenarios.
    """
    if payload.scenario_key in ["live", "live_weather", "default"]:
        CURRENT_RAINFALL_STATE["is_live_mode"] = True
        CURRENT_RAINFALL_STATE["active_scenario_key"] = "live_weather"
        recompute_live_risks()
    elif payload.scenario_key and payload.scenario_key in RAINFALL_SCENARIOS:
        sc = RAINFALL_SCENARIOS[payload.scenario_key]
        CURRENT_RAINFALL_STATE["is_live_mode"] = False
        CURRENT_RAINFALL_STATE["active_scenario_key"] = payload.scenario_key
        CURRENT_RAINFALL_STATE["custom_multiplier"] = sc["rainfall_multiplier"]
        CURRENT_RAINFALL_STATE["rainfall_intensity_mm_hr"] = sc["average_mm_hr"]
    elif payload.custom_multiplier is not None:
        CURRENT_RAINFALL_STATE["is_live_mode"] = False
        CURRENT_RAINFALL_STATE["active_scenario_key"] = "custom_slider"
        CURRENT_RAINFALL_STATE["custom_multiplier"] = max(0.1, min(5.0, payload.custom_multiplier))
        CURRENT_RAINFALL_STATE["rainfall_intensity_mm_hr"] = round(payload.custom_multiplier * 18.0, 1)

    return get_all_road_segments()


@router.get("/scenarios")
def get_rainfall_scenarios():
    """
    Returns available rainfall presets for the demo scrubber, including default Live Weather mode.
    """
    scenarios = dict(RAINFALL_SCENARIOS)
    scenarios["live_weather"] = {
        "name": "Live Real-Time Satellite & Station Weather (Open-Meteo)",
        "description": "Continuous live ingestion of precipitation and 48h forecast across 33 NER district centroids.",
        "rainfall_multiplier": CURRENT_RAINFALL_STATE.get("custom_multiplier", 1.0),
        "average_mm_hr": CURRENT_RAINFALL_STATE.get("rainfall_intensity_mm_hr", 0.0)
    }
    return {
        "active_key": CURRENT_RAINFALL_STATE["active_scenario_key"],
        "is_live_mode": CURRENT_RAINFALL_STATE.get("is_live_mode", True),
        "scenarios": scenarios
    }


@router.post("/recompute")
def trigger_manual_recompute():
    """
    Forces an immediate live weather fetch and risk recomputation across all monitored segments.
    """
    recompute_live_risks()
    return {
        "status": "RECOMPUTED",
        "timestamp": CURRENT_RAINFALL_STATE["last_recompute_time"],
        "active_scenario_key": CURRENT_RAINFALL_STATE["active_scenario_key"],
        "is_live_mode": CURRENT_RAINFALL_STATE["is_live_mode"],
        "average_multiplier": CURRENT_RAINFALL_STATE["custom_multiplier"]
    }



@router.get("/model-info")
def get_model_telemetry():
    """
    Returns Random Forest metrics, feature weights, and scientific calibration citations.
    
    Framing Note:
    The ROC-AUC and accuracy metrics represent an internal-consistency check on a synthetic
    dataset calibrated to match published Eastern Himalaya feature-importance patterns
    (citing the Dibang Valley RF study), not validated accuracy on real landslide records.
    """
    art = get_model()
    return {
        "model_architecture": "scikit-learn RandomForestClassifier (100 estimators, max_depth=10)",
        "evaluation_metrics": art["metrics"],
        "evaluation_context": "Internal-consistency check on a synthetic dataset calibrated to match published Eastern Himalaya feature-importance patterns (Dibang Valley RF study), not validated accuracy on real landslide records.",
        "feature_importances": art["feature_importances"],
        "conditioning_factors_count": len(art["feature_names"]),
        "scientific_citations": [
            {
                "region": "Dibang Valley, Arunachal Pradesh (Eastern Himalaya)",
                "methodology": "Random Forest and XGBoost Landslide Susceptibility zonation with 14 conditioning factors",
                "reported_literature_auc": "0.89 - 0.94",
                "calibration_note": "Synthetic dataset feature-importance patterns are calibrated against this published empirical study. Metrics represent internal consistency of the calibrated benchmark rather than validated accuracy on historical landslide inventories."
            },
            {
                "system": "NASA LHASA (Landslide Hazard Assessment for Situational Awareness)",
                "pattern": "Static Susceptibility Matrix * Live GPM IMERG Satellite Rainfall Multiplier"
            }
        ]
    }


@router.get("/live-weather")
def get_live_weather_status():
    """
    Returns the real-time weather ingestion summary and per-district meteorological data across NER.
    """
    summary = get_weather_summary()
    weather_state = get_current_weather()
    return {
        "summary": summary,
        "districts": weather_state.get("districts", {})
    }


@router.post("/live-weather/refresh")
def refresh_live_weather():
    """
    Forces an immediate batch fetch of live Open-Meteo weather data across all NER district centroids.
    """
    fresh_data = fetch_live_weather()
    summary = get_weather_summary()
    return {
        "message": "Live weather successfully refreshed from Open-Meteo API.",
        "summary": summary
    }


@router.get("/live-status")
def get_live_sync_status():
    """
    Lightweight telemetry endpoint for frontend auto-polling.
    Returns live synchronization state, timestamps, and current regional indicators.
    """
    summary = get_weather_summary()
    return {
        "is_live_mode": CURRENT_RAINFALL_STATE.get("is_live_mode", True),
        "active_scenario_key": CURRENT_RAINFALL_STATE.get("active_scenario_key"),
        "last_recompute_time": CURRENT_RAINFALL_STATE.get("last_recompute_time") or summary.get("timestamp"),
        "rainfall_multiplier": CURRENT_RAINFALL_STATE.get("custom_multiplier", 1.0),
        "rainfall_intensity_mm_hr": CURRENT_RAINFALL_STATE.get("rainfall_intensity_mm_hr", 0.0),
        "hazard_overrides_count": len(CURRENT_RAINFALL_STATE.get("hazard_overrides", {})),
        "source": summary.get("source", "Open-Meteo Live API"),
        "active_districts_count": summary.get("active_districts_count", 33),
        "max_rainfall_district": summary.get("max_rainfall_district")
    }



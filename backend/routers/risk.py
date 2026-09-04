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

# Vectorized one-time initialization (<50ms for all 415 segments)
batch_preload_susceptibility(ROAD_SEGMENTS)

router = APIRouter(prefix="/api/risk", tags=["Landslide Risk & Nowcasting"])

# Global state for dynamic rainfall scenario and crowdsourced hazard updates
CURRENT_RAINFALL_STATE = {
    "active_scenario_key": "monsoon_moderate",
    "custom_multiplier": 1.0,
    "rainfall_intensity_mm_hr": 18.5,
    "hazard_overrides": {} # segment_id -> {status: "blocked", reported_severity: "Severe"}
}

ALERT_TIER_COLORS = {
    "Low": "#10b981",       # Emerald
    "Moderate": "#eab308",  # Amber/Yellow
    "High": "#f97316",      # Orange
    "Very High": "#ef4444",  # Crimson/Red
    "Severe": "#991b1b"     # Dark Red
}


def compute_segment_dynamic_risk(seg: dict, rainfall_mult: float, overrides: dict = None) -> dict:
    """
    Fuses static susceptibility (from scikit-learn RF model) with dynamic rainfall nowcast (LHASA pattern).
    """
    # 1. Static susceptibility inference
    static_result = predict_susceptibility(seg)
    static_score = static_result["static_risk_score"]

    # 2. Dynamic rainfall nowcast multiplier
    # LHASA formulation: Static Susceptibility * (1 + alpha * (Rainfall_current / Rainfall_base))
    dynamic_multiplier = max(0.2, rainfall_mult)
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
        "color": color,
        "is_blocked": is_blocked,
        "blockage_reason": blockage_reason,
        "top_drivers": static_result["top_drivers"],
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


class NowcastUpdateRequest(BaseModel):
    scenario_key: Optional[str] = None
    custom_multiplier: Optional[float] = None
    rainfall_intensity_mm_hr: Optional[float] = None


@router.get("/segments")
def get_all_road_segments():
    """
    Returns all monitored NER road segments with live fused dynamic risk calculations.
    """
    mult = CURRENT_RAINFALL_STATE["custom_multiplier"]
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

    return {
        "current_scenario": CURRENT_RAINFALL_STATE["active_scenario_key"],
        "current_multiplier": mult,
        "current_rainfall_intensity": CURRENT_RAINFALL_STATE["rainfall_intensity_mm_hr"],
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

    mult = CURRENT_RAINFALL_STATE["custom_multiplier"]
    overrides = CURRENT_RAINFALL_STATE["hazard_overrides"]
    result = compute_segment_dynamic_risk(seg, mult, overrides)

    # Add geotechnical narrative
    explanation = (
        f"Segment {seg['name']} on {seg['highway']} is classified as '{result['dynamic_alert_tier']}' risk. "
        f"The slope inclination is {seg['slope_deg']}° with a distance of {seg['dist_to_fault_m']}m to tectonic thrust lineaments. "
        f"Live rainfall multiplier ({mult:.1f}x) combines with the baseline precipitation of {seg['base_rainfall_mm']}mm "
        f"to elevate pore-water pressure along shear planes."
    )
    result["plain_language_explanation"] = explanation

    return result


@router.post("/nowcast")
def update_nowcast_scenario(payload: NowcastUpdateRequest):
    """
    Scrubber endpoint: Updates live rainfall conditions and recalculates regional risk nowcasts immediately.
    """
    if payload.scenario_key and payload.scenario_key in RAINFALL_SCENARIOS:
        sc = RAINFALL_SCENARIOS[payload.scenario_key]
        CURRENT_RAINFALL_STATE["active_scenario_key"] = payload.scenario_key
        CURRENT_RAINFALL_STATE["custom_multiplier"] = sc["rainfall_multiplier"]
        CURRENT_RAINFALL_STATE["rainfall_intensity_mm_hr"] = sc["average_mm_hr"]
    elif payload.custom_multiplier is not None:
        CURRENT_RAINFALL_STATE["active_scenario_key"] = "custom_slider"
        CURRENT_RAINFALL_STATE["custom_multiplier"] = max(0.1, min(5.0, payload.custom_multiplier))
        CURRENT_RAINFALL_STATE["rainfall_intensity_mm_hr"] = round(payload.custom_multiplier * 18.0, 1)

    return get_all_road_segments()


@router.get("/scenarios")
def get_rainfall_scenarios():
    """
    Returns available rainfall presets for the demo scrubber.
    """
    return {
        "active_key": CURRENT_RAINFALL_STATE["active_scenario_key"],
        "scenarios": RAINFALL_SCENARIOS
    }


@router.get("/model-info")
def get_model_telemetry():
    """
    Returns Random Forest metrics, feature weights, and peer-reviewed scientific citations.
    """
    art = get_model()
    return {
        "model_architecture": "scikit-learn RandomForestClassifier (100 estimators, max_depth=10)",
        "evaluation_metrics": art["metrics"],
        "feature_importances": art["feature_importances"],
        "conditioning_factors_count": len(art["feature_names"]),
        "scientific_citations": [
            {
                "region": "Dibang Valley, Arunachal Pradesh (Eastern Himalaya)",
                "methodology": "Random Forest and XGBoost Landslide Susceptibility zonation with 14 conditioning factors",
                "reported_auc": "0.89 - 0.94"
            },
            {
                "system": "NASA LHASA (Landslide Hazard Assessment for Situational Awareness)",
                "pattern": "Static Susceptibility Matrix * Live GPM IMERG Satellite Rainfall Multiplier"
            }
        ]
    }

"""
Setumarg: AI Route Optimizer Router
Generates side-by-side comparison between Naive Shortest Path (blind to hazard nowcasts)
and Setumarg AI Safe Route (actively detouring around high-risk and blocked mountain segments).
Built with OSRM-compatible routing interface and realistic NER road geometry.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from backend.data.seed_ner_data import ROAD_SEGMENTS
from backend.routers.risk import CURRENT_RAINFALL_STATE, compute_segment_dynamic_risk

router = APIRouter(prefix="/api/routing", tags=["AI Safe Routing Engine"])


class RouteRequest(BaseModel):
    origin: str           # e.g., "Guwahati", "Siliguri", "Dimapur"
    destination: str      # e.g., "Silchar", "Gangtok", "Kohima", "Moreh"
    vehicle_type: str = "heavy_truck" # two_wheeler, light_vehicle, heavy_truck


import os
import json
import math

HIGHWAYS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "highways")

def _load_corridor_geometry(filename: str, max_points: int = 2500):
    filepath = os.path.join(HIGHWAYS_DIR, filename)
    if not os.path.exists(filepath):
        return None, None, None
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        feature = data["features"][0]
        props = feature.get("properties", {})
        coords = feature.get("leaflet_coordinates", [])
        if not coords and "geometry" in feature:
            raw = feature["geometry"].get("coordinates", [])
            coords = [[pt[1], pt[0]] for pt in raw]
        
        dist_km = props.get("distance_km")
        dur_hrs = props.get("duration_hrs") or (round(props.get("duration_min", 0) / 60.0, 1) if "duration_min" in props else None)

        if len(coords) > max_points:
            step = math.ceil(len(coords) / max_points)
            downsampled = coords[::step]
            if coords[-1] != downsampled[-1]:
                downsampled.append(coords[-1])
            coords = downsampled

        return coords, dist_km, dur_hrs
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return None, None, None


# Load real turn-by-turn highway coordinates from cached OSRM GeoJSONs
_nh6_coords, _nh6_dist, _nh6_dur = _load_corridor_geometry("nh6_guwahati_silchar.geojson")
_nh6_safe_coords, _nh6_safe_dist, _nh6_safe_dur = _load_corridor_geometry("safe_bypass_guwahati_silchar.geojson")

_nh10_coords, _nh10_dist, _nh10_dur = _load_corridor_geometry("direct_siliguri_gangtok.geojson")
_nh10_safe_coords, _nh10_safe_dist, _nh10_safe_dur = _load_corridor_geometry("safe_bypass_siliguri_gangtok.geojson")

_nh29_coords, _nh29_dist, _nh29_dur = _load_corridor_geometry("direct_guwahati_kohima.geojson")
_nh29_safe_coords, _nh29_safe_dist, _nh29_safe_dur = _load_corridor_geometry("safe_bypass_guwahati_kohima.geojson")

# Key Predefined Corridor Geometries across NER with Real Turn-by-Turn Road Points
CORRIDOR_PRESETS = {
    ("Guwahati", "Silchar"): {
        "naive_route": {
            "name": "Direct Highway (via Shillong - Jowai - Sonapur Tunnel - NH-6 / NH-44)",
            "via_segments": ["SEG-NH-6-NH-44-57", "SEG-NH-6-NH-44-58", "SEG-NH-6-NH-44-59"],
            "distance_km": _nh6_dist or 342.8,
            "base_duration_hrs": _nh6_dur or 8.5,
            "geometry": _nh6_coords or [
                [26.1445, 91.7362], [25.9654, 91.8845], [25.5788, 91.8933],
                [25.4412, 92.2045], [25.1098, 92.3987], [24.9876, 92.4876], [24.8333, 92.7789]
            ]
        },
        "safe_route": {
            "name": "Setumarg Dynamic Valley Bypass (via Nagaon - Lumding - Haflong - NH-27/NH-54)",
            "via_segments": ["SEG-NH-27-02", "SEG-NH-37-NH-715-01"],
            "distance_km": _nh6_safe_dist or 465.6,
            "base_duration_hrs": _nh6_safe_dur or 10.2,
            "geometry": _nh6_safe_coords or [
                [26.1445, 91.7362], [26.2890, 91.9543], [26.3500, 92.6800],
                [25.7500, 93.1800], [25.1800, 93.0200], [24.8333, 92.7789]
            ]
        }
    },
    ("Siliguri", "Gangtok"): {
        "naive_route": {
            "name": "Standard NH-10 Teesta Canyon Route",
            "via_segments": ["SEG-NH-10-01", "SEG-NH-10-02"],
            "distance_km": _nh10_dist or 126.9,
            "base_duration_hrs": _nh10_dur or 4.2,
            "geometry": _nh10_coords or [
                [26.7271, 88.3953], [26.8854, 88.4721], [27.0543, 88.4312],
                [27.1765, 88.5234], [27.3314, 88.6138]
            ]
        },
        "safe_route": {
            "name": "Setumarg Safe Ridgeline Bypass (via Lava - Reshi - Rhenock - Pakyong)",
            "via_segments": ["SEG-NH-27-01"],
            "distance_km": _nh10_safe_dist or 244.8,
            "base_duration_hrs": _nh10_safe_dur or 6.5,
            "geometry": _nh10_safe_coords or [
                [26.7271, 88.3953], [27.0120, 88.6540], [27.0850, 88.6650],
                [27.1650, 88.6890], [27.2400, 88.6010], [27.3314, 88.6138]
            ]
        }
    },
    ("Guwahati", "Kohima"): {
        "naive_route": {
            "name": "Standard NH-29 Hill Pass via Dimapur",
            "via_segments": ["SEG-NH-29-NH-2-01", "SEG-NH-29-NH-2-02"],
            "distance_km": _nh29_dist or 343.5,
            "base_duration_hrs": _nh29_dur or 8.8,
            "geometry": _nh29_coords or [
                [26.1445, 91.7362], [26.3500, 92.6800], [26.6123, 93.7543],
                [25.9067, 93.7278], [25.7890, 93.9212], [25.6743, 94.1089]
            ]
        },
        "safe_route": {
            "name": "Setumarg Escorted Heavy-Corridor Bypass (via Golaghat - Wokha High Plateau)",
            "via_segments": ["SEG-NH-37-NH-715-01", "SEG-NH-37-NH-715-02"],
            "distance_km": _nh29_safe_dist or 460.8,
            "base_duration_hrs": _nh29_safe_dur or 10.5,
            "geometry": _nh29_safe_coords or [
                [26.1445, 91.7362], [26.3500, 92.6800], [26.5123, 93.9876],
                [26.0980, 94.2540], [25.6743, 94.1089]
            ]
        }
    }
}


@router.get("/available-pairs")
def get_available_city_pairs():
    """
    Returns pre-calculated origin/destination pairs for the interactive demo.
    """
    return [
        {"origin": "Guwahati", "destination": "Silchar", "label": "Guwahati → Silchar (Barak Valley Trunk / NH-44)"},
        {"origin": "Siliguri", "destination": "Gangtok", "label": "Siliguri → Gangtok (Sikkim Lifeline / NH-10)"},
        {"origin": "Guwahati", "destination": "Kohima", "label": "Guwahati → Kohima (Nagaland Highway / NH-29)"}
    ]


@router.post("/optimize")
def optimize_route(request: RouteRequest):
    """
    Calculates side-by-side route comparison between Naive and Setumarg AI Hazard-Avoidance route.
    """
    pair_key = (request.origin, request.destination)
    if pair_key not in CORRIDOR_PRESETS:
        # Fallback to default Guwahati -> Silchar
        pair_key = ("Guwahati", "Silchar")

    preset = CORRIDOR_PRESETS[pair_key]
    is_live = (
        CURRENT_RAINFALL_STATE.get("is_live_mode", True)
        and CURRENT_RAINFALL_STATE.get("active_scenario_key") == "live_weather"
    )
    mult = CURRENT_RAINFALL_STATE["custom_multiplier"] if not is_live else None
    overrides = CURRENT_RAINFALL_STATE["hazard_overrides"]

    # Evaluate dynamic risk along naive path segments
    naive_segments_info = []
    naive_max_risk = 0.0
    naive_has_blockage = False
    blocked_segment_names = []
    naive_max_disruption = 0.0
    naive_top_prediction = None

    for seg_id in preset["naive_route"]["via_segments"]:
        seg = next((s for s in ROAD_SEGMENTS if s["id"] == seg_id), None)
        if seg:
            res = compute_segment_dynamic_risk(seg, mult, overrides)
            naive_segments_info.append(res)
            if res["dynamic_risk_score"] > naive_max_risk:
                naive_max_risk = res["dynamic_risk_score"]
            disr = res.get("disruption_likelihood_pct", 0.0)
            if disr > naive_max_disruption:
                naive_max_disruption = disr
                naive_top_prediction = res.get("disruption_prediction_text")
            if res["is_blocked"] or res["dynamic_alert_tier"] in ["Very High", "Severe"]:
                naive_has_blockage = True
                blocked_segment_names.append(f"{seg['name']} ({res['dynamic_alert_tier']})")

    # Evaluate dynamic risk along safe path segments
    safe_segments_info = []
    safe_max_risk = 0.0
    safe_max_disruption = 0.0
    safe_top_prediction = None
    for seg_id in preset["safe_route"]["via_segments"]:
        seg = next((s for s in ROAD_SEGMENTS if s["id"] == seg_id), None)
        if seg:
            res = compute_segment_dynamic_risk(seg, mult, overrides)
            safe_segments_info.append(res)
            if res["dynamic_risk_score"] > safe_max_risk:
                safe_max_risk = res["dynamic_risk_score"]
            disr = res.get("disruption_likelihood_pct", 0.0)
            if disr > safe_max_disruption:
                safe_max_disruption = disr
                safe_top_prediction = res.get("disruption_prediction_text")

    # Vehicle speed modifier
    speed_factor = 1.0
    if request.vehicle_type == "heavy_truck":
        speed_factor = 0.82
    elif request.vehicle_type == "two_wheeler":
        speed_factor = 1.15

    naive_base_duration = round(preset["naive_route"]["base_duration_hrs"] / speed_factor, 1)
    safe_base_duration = round(preset["safe_route"]["base_duration_hrs"] / speed_factor, 1)

    # 1. Geotechnical hazard stranding delay
    naive_hazard_delay_hours = 0.0
    if naive_has_blockage:
        naive_hazard_delay_hours = 14.5 if any("Severe" in s or "Critical" in s for s in blocked_segment_names) else 6.0

    # 2. Traffic congestion delay (distinct signal from time-of-day & vehicle density)
    naive_congestion_delay_hours = round(sum(float(s.get("congestion_delay_hrs", 0.0) or 0.0) for s in naive_segments_info), 2)
    safe_congestion_delay_hours = round(sum(float(s.get("congestion_delay_hrs", 0.0) or 0.0) for s in safe_segments_info), 2)

    naive_total_delay_hours = round(naive_hazard_delay_hours + naive_congestion_delay_hours, 2)
    safe_total_delay_hours = safe_congestion_delay_hours

    naive_effective_duration = round(naive_base_duration + naive_total_delay_hours, 1)
    safe_effective_duration = round(safe_base_duration + safe_total_delay_hours, 1)
    distance_delta_km = round(preset["safe_route"]["distance_km"] - preset["naive_route"]["distance_km"], 1)

    # Primary delay attribution
    if naive_hazard_delay_hours >= 2.0:
        naive_primary_delay_factor = "LANDSLIDE_HAZARD"
    elif naive_congestion_delay_hours >= 0.5:
        naive_primary_delay_factor = "TRAFFIC_CONGESTION"
    else:
        naive_primary_delay_factor = "NOMINAL_TRANSIT"

    # Human-readable AI avoidance summary with live meteorological, disruption & congestion context
    if naive_has_blockage:
        avoidance_rationale = (
            f"Setumarg AI rerouted away from {', '.join(blocked_segment_names)}. "
            f"The safe bypass adds {distance_delta_km} km, but averts {naive_hazard_delay_hours:.1f} hours of landslide stranding "
            f"and avoids {naive_congestion_delay_hours:.1f} hours of traffic bottleneck queuing."
        )
    elif naive_max_disruption >= 60.0:
        avoidance_rationale = (
            f"High near-term disruption risk ({naive_max_disruption}% chance in 24-48h) detected on direct corridor via live weather. "
            f"Setumarg AI proactively recommends safe valley bypass to avert impending road closure delays."
        )
    elif naive_congestion_delay_hours >= 1.5:
        avoidance_rationale = (
            f"Direct corridor experiences heavy traffic congestion (+{naive_congestion_delay_hours:.1f} hrs delay). "
            f"Setumarg recommends bypass route for consistent commercial delivery timelines."
        )
    else:
        avoidance_rationale = (
            f"Direct corridor is currently stable ({naive_max_risk:.2f} dynamic risk score, {naive_max_disruption}% 24-48h disruption likelihood, "
            f"{naive_congestion_delay_hours:.1f}h traffic friction). Safe for transit under continuous live monitoring."
        )

    recommendation = "SAFE_BYPASS_RECOMMENDED" if (naive_has_blockage or naive_max_disruption >= 60.0 or naive_congestion_delay_hours >= 2.5) else "DIRECT_PATH_ACCEPTABLE"

    return {
        "origin": request.origin,
        "destination": request.destination,
        "vehicle_type": request.vehicle_type,
        "is_live_weather_mode": is_live,
        "live_weather_sync_time": CURRENT_RAINFALL_STATE.get("last_recompute_time"),
        "ai_recommendation": recommendation,
        "avoidance_rationale": avoidance_rationale,
        "summary_comparison": {
            "extra_distance_km": distance_delta_km,
            "hours_saved_against_stranding": naive_hazard_delay_hours,
            "congestion_delay_saved_hrs": max(0.0, round(naive_congestion_delay_hours - safe_congestion_delay_hours, 2)),
            "total_delay_hours_avoided": round(max(0.0, naive_effective_duration - safe_effective_duration), 1),
            "primary_bottleneck_driver": naive_primary_delay_factor,
            "naive_risk_index": round(naive_max_risk * 100, 1),
            "safe_risk_index": round(safe_max_risk * 100, 1),
            "safety_gain_percent": round((1.0 - (safe_max_risk / max(0.1, naive_max_risk))) * 100, 1),
            "naive_disruption_likelihood_pct": naive_max_disruption,
            "safe_disruption_likelihood_pct": safe_max_disruption
        },
        "naive_route": {
            "name": preset["naive_route"]["name"],
            "distance_km": preset["naive_route"]["distance_km"],
            "duration_hrs": naive_effective_duration,
            "base_duration_hrs": naive_base_duration,
            "delay_penalty_hrs": naive_total_delay_hours,
            "delay_breakdown": {
                "hazard_delay_hrs": naive_hazard_delay_hours,
                "congestion_delay_hrs": naive_congestion_delay_hours,
                "total_delay_hrs": naive_total_delay_hours,
                "primary_cause": naive_primary_delay_factor
            },
            "hazard_delay_hrs": naive_hazard_delay_hours,
            "congestion_delay_hrs": naive_congestion_delay_hours,
            "primary_cause": naive_primary_delay_factor,
            "max_risk_score": round(naive_max_risk, 3),
            "disruption_likelihood_pct": naive_max_disruption,
            "disruption_prediction_text": naive_top_prediction,
            "has_active_blockage": naive_has_blockage,
            "compromised_segments": blocked_segment_names,
            "via_segments": preset["naive_route"].get("via_segments", []),
            "coordinates": preset["naive_route"]["geometry"],
            "color": "#ef4444"
        },
        "safe_route": {
            "name": preset["safe_route"]["name"],
            "distance_km": preset["safe_route"]["distance_km"],
            "duration_hrs": safe_effective_duration,
            "base_duration_hrs": safe_base_duration,
            "delay_penalty_hrs": safe_total_delay_hours,
            "delay_breakdown": {
                "hazard_delay_hrs": 0.0,
                "congestion_delay_hrs": safe_congestion_delay_hours,
                "total_delay_hrs": safe_total_delay_hours,
                "primary_cause": "NOMINAL_TRANSIT"
            },
            "hazard_delay_hrs": 0.0,
            "congestion_delay_hrs": safe_congestion_delay_hours,
            "primary_cause": "NOMINAL_TRANSIT",
            "max_risk_score": round(safe_max_risk, 3),
            "disruption_likelihood_pct": safe_max_disruption,
            "disruption_prediction_text": safe_top_prediction,
            "has_active_blockage": False,
            "via_segments": preset["safe_route"].get("via_segments", []),
            "coordinates": preset["safe_route"]["geometry"],
            "color": "#10b981"
        }
    }

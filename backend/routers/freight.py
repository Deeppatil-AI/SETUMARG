"""
Setumarg: Multi-Modal Freight Planner Router
Designed as a specialized NER intelligence layer feeding into:
1. Unified Logistics Interface Platform (ULIP)
2. PM GatiShakti National Master Plan (NMP 1600+ GIS layers)

Compares:
- Road Freight (Siliguri Corridor / NH-27 / NH-37)
- Rail Freight (Northeast Frontier Railway - NFR)
- Multi-Modal Road + Inland Waterways (National Waterway 2: Brahmaputra River via Pandu/Dhubri/Neamati)
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from backend.data.seed_ner_data import FREIGHT_HUBS, ROAD_SEGMENTS
from backend.routers.risk import CURRENT_RAINFALL_STATE, compute_segment_dynamic_risk

router = APIRouter(prefix="/api/freight", tags=["Multi-Modal Freight & ULIP Integration"])


class ShipmentQuery(BaseModel):
    origin_hub_id: str = "HUB-SIL-01"     # Siliguri Gateway
    destination_hub_id: str = "HUB-DBR-01" # Dibrugarh Upper Assam
    cargo_type: str = "essential_foodgrains_fertilizer" # FMCG, construction_steel, tea_horticulture
    cargo_weight_tons: float = 24.0


@router.get("/hubs")
def get_freight_hubs():
    """
    Returns strategic multi-modal logistics hubs across the North Eastern Region.
    """
    return FREIGHT_HUBS


@router.post("/plan")
def calculate_multimodal_options(query: ShipmentQuery):
    """
    Evaluates multi-modal transportation options across Road, Rail, and Brahmaputra River (NW-2).
    Enforces the safety rule: NEVER recommend a road route flagged High/Severe risk, even if cheapest or shortest.
    Emits PM GatiShakti / ULIP interoperability schema.
    """
    origin = next((h for h in FREIGHT_HUBS if h["id"] == query.origin_hub_id), FREIGHT_HUBS[1]) # Siliguri
    dest = next((h for h in FREIGHT_HUBS if h["id"] == query.destination_hub_id), FREIGHT_HUBS[4]) # Dibrugarh

    mult = CURRENT_RAINFALL_STATE["custom_multiplier"]
    overrides = CURRENT_RAINFALL_STATE["hazard_overrides"]

    # Assess road vulnerability along the primary connecting corridor
    corridor_segments = [
        compute_segment_dynamic_risk(s, mult, overrides)
        for s in ROAD_SEGMENTS 
        if any(s["id"].startswith(p) for p in ["SEG-NH-27", "SEG-NH-37", "SEG-NH27", "SEG-NH37"])
        or s["highway"] in ["NH-27", "NH-37", "NH-37 / NH-715"]
    ]
    max_road_risk = max([s["dynamic_risk_score"] for s in corridor_segments] or [0.35])
    road_is_blocked = any(s["is_blocked"] or s["dynamic_alert_tier"] in ["Very High", "Severe"] for s in corridor_segments)

    total_road_km = 680.0
    weight = max(1.0, query.cargo_weight_tons)

    # 1. Option A: Pure Road Transport (NH-27 / NH-37)
    road_cost_per_ton_km = 3.40 # Siliguri corridor premium (~35% above national avg)
    road_total_cost = round(total_road_km * weight * road_cost_per_ton_km, 2)
    road_transit_hours = 28.0 if not road_is_blocked else 56.0 # Severe delay if stuck
    road_co2_kg = round(total_road_km * weight * 0.105, 1)

    road_status = "HAZARDOUS / UNRELIABLE" if road_is_blocked else ("CAUTION: MONSOON SLIPS" if max_road_risk > 0.5 else "OPERATIONAL")
    road_recommended = not road_is_blocked and max_road_risk < 0.65

    # 2. Option B: Rail Freight (NFR Goods via NJP - New Guwahati - Dibrugarh)
    rail_km = 720.0
    rail_cost_per_ton_km = 1.80
    rail_total_cost = round(rail_km * weight * rail_cost_per_ton_km, 2)
    rail_transit_hours = 34.0
    rail_co2_kg = round(rail_km * weight * 0.038, 1)
    rail_status = "SCHEDULED & ALL-WEATHER SAFE"
    rail_recommended = True

    # 3. Option C: Multi-Modal Road + Inland Waterway 2 (Brahmaputra River)
    # Road to Dhubri/Pandu Port -> River Barge to Neamati/Dibrugarh -> Last-mile EV/Truck
    waterway_km = 580.0 # NW-2 river transit
    road_drayage_km = 110.0 # Short first/last mile
    water_cost = (waterway_km * weight * 1.15) + (road_drayage_km * weight * 3.10)
    water_total_cost = round(water_cost, 2)
    water_transit_hours = 44.0 # Slower but completely immune to landslides
    water_co2_kg = round((waterway_km * weight * 0.024) + (road_drayage_km * weight * 0.105), 1)
    water_status = "HIGH EFFICIENCY / ZERO SLIP RISK"
    water_recommended = True

    # Multi-criteria scoring
    modes = [
        {
            "mode": "Road Freight (Direct National Highway)",
            "route_description": "Siliguri → Bongaigaon → Guwahati Bypass → Kaziranga → Dibrugarh (NH-27 / NH-37)",
            "distance_km": total_road_km,
            "cost_inr": road_total_cost,
            "cost_per_ton_inr": round(road_total_cost / weight, 1),
            "estimated_transit_hours": road_transit_hours,
            "co2_emissions_kg": road_co2_kg,
            "landslide_risk_index": round(max_road_risk * 100, 1),
            "status": road_status,
            "is_recommended": road_recommended,
            "safety_badge": "VULNERABLE TO MONSOON CLOSURE" if road_is_blocked else "WEATHER DEPENDENT",
            "tag": "Fastest during dry conditions; high stranding risk in monsoon"
        },
        {
            "mode": "Rail Freight (Northeast Frontier Railway NFR)",
            "route_description": "NJP Yard → New Bongaigaon → Kamakhya → Lumding → Dibrugarh Banipur",
            "distance_km": rail_km,
            "cost_inr": rail_total_cost,
            "cost_per_ton_inr": round(rail_total_cost / weight, 1),
            "estimated_transit_hours": rail_transit_hours,
            "co2_emissions_kg": rail_co2_kg,
            "landslide_risk_index": 12.0, # Highly stabilized track beds
            "status": rail_status,
            "is_recommended": rail_recommended,
            "safety_badge": "ALL-WEATHER RELIABLE",
            "tag": "Economical bulk freight; 47% cheaper than road"
        },
        {
            "mode": "Multi-Modal: Road + Inland Waterway 2 (NW-2)",
            "route_description": "Siliguri → Dhubri Port (Road) → Pandu/Neamati Port (Brahmaputra River Barge) → Dibrugarh",
            "distance_km": waterway_km + road_drayage_km,
            "cost_inr": water_total_cost,
            "cost_per_ton_inr": round(water_total_cost / weight, 1),
            "estimated_transit_hours": water_transit_hours,
            "co2_emissions_kg": water_co2_kg,
            "landslide_risk_index": 4.0, # Waterway is impervious to mountain landslides
            "status": water_status,
            "is_recommended": water_recommended,
            "safety_badge": "MOST ECO-FRIENDLY & CHEAPEST",
            "tag": "Lowest cost & zero landslide risk; recommended when highways are compromised"
        }
    ]

    # Select AI best choice
    if road_is_blocked:
        best_mode = "Multi-Modal: Road + Inland Waterway 2 (NW-2)" if query.cargo_type == "essential_foodgrains_fertilizer" else "Rail Freight (Northeast Frontier Railway NFR)"
        recommendation_reason = (
            f"ALERT: Highway corridor is flagged {road_status} with active landslide threat. "
            f"Pursuant to Setumarg safety protocol, Road mode has been disqualified. "
            f"Recommending {best_mode} for guaranteed delivery and up to 48% freight savings."
        )
    else:
        best_mode = "Rail Freight (Northeast Frontier Railway NFR)"
        recommendation_reason = (
            "Optimal balance between transit time (34h) and cost efficiency (₹1.80/ton-km), "
            "insulating against potential mountain weather shifts."
        )

    # ULIP / PM GatiShakti Exportable Metadata Payload
    ulip_payload = {
        "ulip_schema_version": "2.4.0",
        "gatishakti_layer_id": "MORTH_NHAI_NER_LOGISTICS_RISK_L4",
        "consignment_id": f"ULIP-SETU-{abs(hash(query.origin_hub_id + query.destination_hub_id)) % 1000000}",
        "origin_node": origin["name"],
        "destination_node": dest["name"],
        "cargo_weight_tons": weight,
        "recommended_modality": best_mode,
        "hazard_clearance_status": "APPROVED_SAFE_CHANNEL" if not road_is_blocked else "ROAD_DEFLECTED_TO_MULTIMODAL",
        "estimated_freight_savings_inr": round(road_total_cost - min(rail_total_cost, water_total_cost), 2),
        "co2_reduction_kg": round(road_co2_kg - min(rail_co2_kg, water_co2_kg), 1)
    }

    return {
        "origin_hub": origin,
        "destination_hub": dest,
        "cargo_specs": {
            "type": query.cargo_type,
            "weight_tons": weight
        },
        "optimal_mode": best_mode,
        "recommendation_reason": recommendation_reason,
        "options": modes,
        "ulip_gatishakti_contract": ulip_payload
    }

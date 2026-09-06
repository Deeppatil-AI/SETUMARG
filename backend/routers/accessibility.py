"""
Setumarg: Accessibility Intelligence Router
Grounded in the World Bank Rural Access Index (RAI) and road network travel-time isochrones.
Evaluates which villages face severe health and logistics isolation when mountain trunk highways fail.
Includes emergency SMS/IVR broadcast stub for low-connectivity border villages.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from backend.data.seed_ner_data import VILLAGES, ROAD_SEGMENTS
from backend.routers.risk import CURRENT_RAINFALL_STATE, compute_segment_dynamic_risk

router = APIRouter(prefix="/api/accessibility", tags=["Accessibility Intelligence & RAI"])

# In-memory SMS/IVR dispatch log
DISPATCHED_ALERTS = []


def calculate_village_accessibility(village: dict, segment_risk_map: dict) -> dict:
    """
    Computes network travel-time accessibility, World Bank Rural Access Index status,
    and dynamic cutoff probability when feeder roads are compromised.
    """
    feeder_id = village.get("primary_feeder_segment")
    feeder_info = segment_risk_map.get(feeder_id, {})
    feeder_alert_tier = feeder_info.get("dynamic_alert_tier", "Low")
    feeder_is_blocked = feeder_info.get("is_blocked", False)

    base_travel_hospital = village["travel_time_hospital_min"]
    base_travel_highway = village["travel_time_highway_min"]

    # Dynamic travel time inflation when road segment is degraded or blocked
    travel_inflation_factor = 1.0
    is_cut_off = False
    cutoff_severity = "Accessible"

    if feeder_is_blocked:
        travel_inflation_factor = 4.5
        is_cut_off = True
        cutoff_severity = "CRITICAL CUT-OFF"
    elif feeder_alert_tier == "Severe":
        travel_inflation_factor = 3.2
        is_cut_off = True
        cutoff_severity = "HIGH RISK OF ISOLATION"
    elif feeder_alert_tier == "Very High":
        travel_inflation_factor = 2.0
        cutoff_severity = "Vulnerable Access"
    elif feeder_alert_tier == "High":
        travel_inflation_factor = 1.4
        cutoff_severity = "Moderate Delay"

    effective_hospital_time = int(base_travel_hospital * travel_inflation_factor)
    effective_highway_time = int(base_travel_highway * travel_inflation_factor)

    # Real-time weather for the village's coordinate / district
    from backend.services.weather_service import get_weather_for_coordinate
    w_info = get_weather_for_coordinate(village["lat"], village["lng"])
    current_rain_mm = round(float(w_info.get("current_rain_mm", 0.0)), 1)
    weather_desc = w_info.get("weather_description", "Clear sky")
    forecast_24h_mm = round(float(w_info.get("forecast_next_24h_mm", 0.0)), 1)

    # Emergency medical triage & evacuation criteria:
    # 1. Airlift Required: Road physically blocked OR severe cutoff with PHC travel > 180m
    airlift_required = bool(feeder_is_blocked or (is_cut_off and effective_hospital_time >= 180))
    airlift_rationale = (
        "Ground transit severed by structural road breach. IAF / Pawan Hans aerial medical evacuation recommended."
        if airlift_required else None
    )

    # 2. Medical Triage Tier
    if airlift_required or feeder_is_blocked:
        medical_triage_tier = "CRITICAL_EMERGENCY"
    elif is_cut_off or effective_hospital_time > 120:
        medical_triage_tier = "HIGH_ISOLATION_RISK"
    elif effective_hospital_time > 60 or feeder_alert_tier in ["High", "Very High"]:
        medical_triage_tier = "WEATHER_SLOWDOWN"
    else:
        medical_triage_tier = "PASSABLE"

    # World Bank RAI compliance criteria:
    # Within 30 min of all-season road & 60 min of tertiary healthcare
    meets_rai_standard = (effective_highway_time <= 30) and (effective_hospital_time <= 60) and (not is_cut_off)

    # Composite Isolation Score (0 to 100, higher = more vulnerable)
    isolation_score = min(
        100.0,
        (effective_hospital_time / 180.0) * 45.0 +
        (1.0 if not village["all_weather_road_access"] else 0.0) * 20.0 +
        (35.0 if is_cut_off else (15.0 if feeder_alert_tier in ["High", "Very High"] else 0.0))
    )

    return {
        "id": village["id"],
        "name": village["name"],
        "state": village["state"],
        "district": village["district"],
        "lat": village["lat"],
        "lng": village["lng"],
        "population": village["population"],
        "elevation_m": village["elevation_m"],
        "nearest_facility": village["nearest_facility"],
        "base_travel_hospital_min": base_travel_hospital,
        "effective_travel_hospital_min": effective_hospital_time,
        "base_travel_highway_min": base_travel_highway,
        "effective_travel_highway_min": effective_highway_time,
        "primary_feeder_segment": feeder_id,
        "feeder_highway_name": feeder_info.get("name", "Arterial Feeder"),
        "feeder_alert_tier": feeder_alert_tier,
        "feeder_is_blocked": feeder_is_blocked,
        "is_cut_off": is_cut_off,
        "cutoff_severity": cutoff_severity,
        "medical_triage_tier": medical_triage_tier,
        "airlift_required": airlift_required,
        "airlift_rationale": airlift_rationale,
        "live_rain_mm": current_rain_mm,
        "weather_description": weather_desc,
        "forecast_24h_mm": forecast_24h_mm,
        "meets_rai_standard": meets_rai_standard,
        "isolation_score": round(isolation_score, 1),
        "connectivity_type": village["connectivity_type"],
        "sarpanch_contact": village["sarpanch_contact"]
    }


@router.get("/villages")
def get_accessibility_index(sort_by: Optional[str] = "isolation_score", order: Optional[str] = "desc"):
    """
    Returns all monitored villages with dynamic travel-time isochrones,
    isolation scores, and population-weighted vulnerability statistics.
    """
    mult = CURRENT_RAINFALL_STATE["custom_multiplier"]
    overrides = CURRENT_RAINFALL_STATE["hazard_overrides"]

    # Precompute road segments risk map
    segment_risk_map = {}
    for seg in ROAD_SEGMENTS:
        segment_risk_map[seg["id"]] = compute_segment_dynamic_risk(seg, mult, overrides)

    scored_villages = [calculate_village_accessibility(v, segment_risk_map) for v in VILLAGES]

    # Population aggregates
    total_population = sum(v["population"] for v in scored_villages)
    cut_off_population = sum(v["population"] for v in scored_villages if v["is_cut_off"])
    rai_compliant_population = sum(v["population"] for v in scored_villages if v["meets_rai_standard"])

    cut_off_count = sum(1 for v in scored_villages if v["is_cut_off"])
    airlift_count = sum(1 for v in scored_villages if v["airlift_required"])
    peak_rainfall = max((v["live_rain_mm"] for v in scored_villages), default=0.0)
    rai_pct = round((rai_compliant_population / total_population) * 100, 1) if total_population else 0.0

    # Distinct states represented
    states_list = sorted(list(set(v["state"] for v in scored_villages)))

    # Regional operational emergency alert level
    if cut_off_count >= 5 or airlift_count >= 2:
        regional_status = "CRITICAL_MASS_ISOLATION"
    elif cut_off_count >= 1 or peak_rainfall >= 5.0:
        regional_status = "ELEVATED_WEATHER_ALERT"
    else:
        regional_status = "NORMAL_OPERATIONS"

    # Sorting
    reverse_order = (order.lower() == "desc")
    if sort_by in ["isolation_score", "population", "effective_travel_hospital_min", "live_rain_mm"]:
        scored_villages.sort(key=lambda x: x.get(sort_by, 0), reverse=reverse_order)

    return {
        "summary": {
            "total_villages_monitored": len(scored_villages),
            "total_rural_population": total_population,
            "currently_isolated_villages": cut_off_count,
            "population_at_risk_or_cut_off": cut_off_population,
            "airlift_required_villages_count": airlift_count,
            "peak_district_rainfall_mm": peak_rainfall,
            "regional_emergency_status": regional_status,
            "states_represented": states_list,
            "rural_access_index_percent": rai_pct,
            "methodology_note": "World Bank RAI standard: % rural pop within 30 min of all-season road. Road network travel times used instead of straight-line distance (19% correction)."
        },
        "villages": scored_villages
    }


class TriggerSMSRequest(BaseModel):
    village_id: str
    message_type: str = "Landslide Feeder Blockage Early Warning"
    custom_text: Optional[str] = None
    language: Optional[str] = "en"  # "en", "hi", "as", "bn"


def generate_multilingual_alert(village: dict, lang: str = "en") -> dict:
    """
    Generates official multi-lingual emergency dispatch alerts for North Eastern Region (PS26002 point h).
    Supports English (en), Hindi (hi), Assamese (as), and Bengali (bn).
    """
    v_name = village["name"]
    dist = village["district"]
    facility = village.get("nearest_facility", "CHC/PHC Hospital")

    templates = {
        "en": (
            f"[SETUMARG URGENT] Warning for {v_name} ({dist}): Feeder road is under high landslide risk/blockage. "
            f"Emergency medical transit to {facility} currently inflated to >120m. "
            f"Activate community emergency rations. SMS sent via C-DoT / Exotel rural gateway."
        ),
        "hi": (
            f"[सेतुमार्ग आपातकालीन चेतावनी] {v_name} ({dist}) हेतु चेतावनी: मुख्य संपर्क मार्ग पर भारी भूस्खलन का जोखिम/अवरोध है। "
            f"{facility} के लिए आपातकालीन चिकित्सा यात्रा समय 120 मिनट से अधिक हो गया है। "
            f"ग्राम आपदा राहत सक्रिय करें। C-DoT / Exotel ग्रामीण गेटवे द्वारा प्रेषित।"
        ),
        "as": (
            f"[সেতুমৰ্গ জৰুৰীকালীন সতৰ্কবাৰ্তা] {v_name} ({dist}) ৰ বাবে সতৰ্কবাৰ্তা: সংযোগকাৰী পথত ভূমিস্খলনৰ উচ্চ আশংকা/অৱৰোধ আছে। "
            f"{facility} লৈ চিকিৎসা যাত্ৰাৰ সময় ১২০ মিনিটৰো অধিক হৈছে। "
            f"সম্প্ৰদায়ৰ জৰুৰীকালীন খাদ্য সাহায্য সক্ৰিয় কৰক। C-DoT / Exotel গ্ৰাম্য গেটৱেৰ জৰিয়তে প্ৰেৰিত।"
        ),
        "bn": (
            f"[সেতুমাৰ্গ জরুরি সতর্কতা] {v_name} ({dist})-এর জন্য সতর্কতা: সংযোগ সড়কে ভারী ভূমিধসের ঝুঁকি/অবরোধ রয়েছে। "
            f"{facility}-তে জরুরি চিকিৎসার যাতায়াত সময় এখন ১২০ মিনিটের বেশি। "
            f"গ্রাম পঞ্চায়েত ত্রাণ ব্যবস্থা সক্রিয় করুন। C-DoT / Exotel গ্রামীণ গেটওয়ের মাধ্যমে প্রেরিত।"
        )
    }

    chosen_lang = lang.lower() if lang and lang.lower() in templates else "en"
    return {
        "language": chosen_lang,
        "message": templates[chosen_lang],
        "all_translations": templates
    }


@router.get("/alert-templates")
def get_alert_templates(village_id: Optional[str] = "VIL-01", language: Optional[str] = "en"):
    """
    Returns localized SMS/IVR templates in English, Hindi, Assamese, and Bengali for a given village.
    """
    vil = next((v for v in VILLAGES if v["id"] == village_id), VILLAGES[0])
    return generate_multilingual_alert(vil, language or "en")


@router.post("/trigger-sms-ivr")
def trigger_emergency_sms_ivr(payload: TriggerSMSRequest):
    """
    Mock emergency SMS / IVR broadcast stub for low-bandwidth 2G border villages.
    Supports multilingual dispatch in English, Hindi, Assamese, and Bengali (PS26002 point h).
    Simulates gateway handshake via Twilio / Exotel / C-DoT.
    """
    vil = next((v for v in VILLAGES if v["id"] == payload.village_id), None)
    if not vil:
        raise HTTPException(status_code=404, detail=f"Village {payload.village_id} not found.")

    chosen_lang = payload.language or "en"
    auto_alert = generate_multilingual_alert(vil, chosen_lang)
    alert_text = payload.custom_text or auto_alert["message"]

    dispatch_record = {
        "dispatch_id": f"DISP-2026-{len(DISPATCHED_ALERTS) + 1:04d}",
        "village_id": vil["id"],
        "village_name": vil["name"],
        "language": chosen_lang,
        "recipient_role": "Gram Panchayat Head / ASHA Worker",
        "recipient_phone": vil["sarpanch_contact"],
        "connectivity_channel": vil["connectivity_type"],
        "channel_used": "IVR Voice Broadcast & C-DoT 2G SMS",
        "gateway": "Exotel / Twilio / C-DoT NER Emergency Trunk",
        "status": "DELIVERED (ACK Received)",
        "message": alert_text
    }

    DISPATCHED_ALERTS.append(dispatch_record)

    return {
        "success": True,
        "dispatch": dispatch_record,
        "note": "Production implementation uses C-DoT / Exotel / BSNL Satellite Gateway for non-4G hill villages."
    }


@router.get("/dispatched-alerts")
def list_dispatched_alerts():
    """
    Returns the log of all simulated emergency alerts sent to remote hill villages.
    """
    return {
        "count": len(DISPATCHED_ALERTS),
        "alerts": DISPATCHED_ALERTS[::-1]
    }

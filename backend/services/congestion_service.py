"""
Setumarg: Traffic Congestion Service (PS26002 Requirement b)
Evaluates traffic congestion as a distinct, labeled disruption factor
alongside physical landslide hazard risk. Incorporates time-of-day diurnal
patterns, active fleet vehicle density, and detour spillover bottlenecks.
"""

from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import math
import logging

logger = logging.getLogger("setumarg.congestion")

# IST timezone (UTC + 5:30)
IST = timezone(timedelta(hours=5, minutes=30))


def get_current_ist_hour() -> float:
    """Returns the current local hour in Indian Standard Time (IST)."""
    now_ist = datetime.now(IST)
    return now_ist.hour + (now_ist.minute / 60.0)


def compute_time_of_day_factor(ist_hour: Optional[float] = None) -> float:
    """
    Computes diurnal traffic demand multiplier for NER highways.
    Peak morning (08:00 - 10:30) & evening (17:00 - 20:00) IST traffic vs off-peak.
    """
    h = ist_hour if ist_hour is not None else get_current_ist_hour()

    # Morning rush (08:00 - 11:00)
    if 8.0 <= h <= 11.0:
        return 0.85
    # Evening rush (17:00 - 20:30)
    elif 17.0 <= h <= 20.5:
        return 0.80
    # Day commercial haulage (11:00 - 17:00)
    elif 11.0 < h < 17.0:
        return 0.55
    # Early morning / late evening shoulder (06:00 - 08:00, 20:30 - 22:30)
    elif (6.0 <= h < 8.0) or (20.5 < h <= 22.5):
        return 0.40
    # Night time (22:30 - 06:00)
    else:
        return 0.20


def evaluate_segment_congestion(seg: dict, active_vehicles: Optional[list] = None) -> Dict[str, Any]:
    """
    Evaluates traffic congestion for a road segment as a distinct disruption signal.
    Combines:
    1. Time of day in IST (peak vs off-peak).
    2. Real-time fleet vehicle concentration situated on the segment.
    3. Mountain geometry bottleneck multiplier (narrow steep gorges have higher friction).
    """
    seg_id = seg.get("id", "")
    length_km = float(seg.get("length_km", 4.0))
    slope_deg = float(seg.get("slope_deg", 25.0))

    # 1. Time of Day factor
    tod_factor = compute_time_of_day_factor()

    # 2. Vehicle density from active simulated fleet
    vehicles_on_seg = []
    if active_vehicles:
        vehicles_on_seg = [v for v in active_vehicles if v.get("current_segment_id") == seg_id]

    veh_count = len(vehicles_on_seg)
    density_factor = min(1.0, veh_count * 0.45)

    # 3. Mountain geometric bottleneck penalty (steep hill cuts constrain passing)
    hill_penalty = 1.35 if slope_deg > 32.0 else 1.0

    # 4. Composite congestion score [0.0 - 1.0]
    base_congestion = (0.35 * tod_factor) + (0.65 * density_factor)
    composite_score = min(1.0, round(base_congestion * hill_penalty, 3))

    # 5. Classify congestion tier
    if composite_score >= 0.75:
        tier = "Severe Gridlock"
        speed_factor = 0.25 # 75% speed loss
    elif composite_score >= 0.50:
        tier = "Heavy Congestion"
        speed_factor = 0.50
    elif composite_score >= 0.28:
        tier = "Moderate Traffic"
        speed_factor = 0.75
    else:
        tier = "Low Traffic / Free Flow"
        speed_factor = 1.0

    # 6. Estimate distinct congestion delay (in addition to or separate from landslide hazard delay)
    nominal_speed_kmh = 45.0
    actual_speed_kmh = max(10.0, nominal_speed_kmh * speed_factor)
    
    nominal_time_min = (length_km / nominal_speed_kmh) * 60.0
    congested_time_min = (length_km / actual_speed_kmh) * 60.0
    congestion_delay_min = max(0.0, round(congested_time_min - nominal_time_min, 1))
    congestion_delay_hrs = round(congestion_delay_min / 60.0, 2)

    return {
        "congestion_index": composite_score,
        "congestion_tier": tier,
        "congestion_delay_min": congestion_delay_min,
        "congestion_delay_hrs": congestion_delay_hrs,
        "effective_speed_kmh": round(actual_speed_kmh, 1),
        "vehicles_present_count": veh_count,
        "time_of_day_factor": round(tod_factor, 2)
    }

"""
Setumarg: Fleet Tracking Service (GPS Telematics Simulation)
Simulates real-time commercial & relief fleet movements across NER corridors.
Directly linked to dynamic road segment risk: vehicles become 'stranded'
if their current road segment enters High or Severe alert tiers, or is blocked.
"""

from typing import List, Dict, Any, Optional
import math
import time
from datetime import datetime, timezone
import logging

from backend.data.seed_ner_data import ROAD_SEGMENTS

logger = logging.getLogger("setumarg.fleet")

# Pre-compiled corridor route paths
_CORRIDOR_ROUTES: Dict[str, Dict[str, Any]] = {}

def _init_corridor_routes():
    """Compiles ordered waypoints and segment index mapping for each corridor."""
    global _CORRIDOR_ROUTES
    if _CORRIDOR_ROUTES:
        return

    # Group segments by corridor
    corridor_segs: Dict[str, List[dict]] = {}
    for seg in ROAD_SEGMENTS:
        corridor = seg.get("corridor") or seg.get("highway") or "General"
        corridor_segs.setdefault(corridor, []).append(seg)

    for corridor, segs in corridor_segs.items():
        all_pts = []
        seg_ranges = [] # list of (start_idx, end_idx, seg_dict)
        for seg in segs:
            coords = seg.get("coordinates", [])
            if not coords:
                continue
            start_idx = len(all_pts)
            for pt in coords:
                # Deduplicate consecutive identical points
                if not all_pts or (abs(all_pts[-1][0] - pt[0]) > 1e-5 or abs(all_pts[-1][1] - pt[1]) > 1e-5):
                    all_pts.append([float(pt[0]), float(pt[1])])
            end_idx = max(start_idx, len(all_pts) - 1)
            seg_ranges.append((start_idx, end_idx, seg))

        if len(all_pts) >= 2:
            _CORRIDOR_ROUTES[corridor] = {
                "waypoints": all_pts,
                "total_points": len(all_pts),
                "seg_ranges": seg_ranges,
                "segments": segs
            }

_init_corridor_routes()


# Initial Fleet Definitions across key NER corridors
INITIAL_VEHICLES: List[Dict[str, Any]] = [
    {
        "id": "VEH-AS-01",
        "name": "NER-MED-101 (Lifeline Pharma)",
        "cargo_type": "Medicines & Vaccines",
        "cargo_category": "medicines",
        "cargo_weight_tons": 6.8,
        "origin": "Guwahati Central Medical Depot",
        "destination": "Silchar Civil Hospital",
        "corridor": "NH-6 / NH-44 Guwahati to Silchar via Shillong and Sonapur Tunnel",
        "progress_pct": 32.5,
        "base_speed_kmh": 48.0,
        "driver": "B. Barman",
        "contact": "+91 94350-11201"
    },
    {
        "id": "VEH-NL-02",
        "name": "NER-FOOD-204 (PDS Food Convoy)",
        "cargo_type": "PDS Food Grains & Pulses",
        "cargo_category": "food",
        "cargo_weight_tons": 14.2,
        "origin": "Dimapur Goods Terminal",
        "destination": "Kohima Supply Depot",
        "corridor": "NH-29 / NH-2 Dimapur to Kohima and Imphal via Phesama",
        "progress_pct": 48.0,
        "base_speed_kmh": 40.0,
        "driver": "T. Angami",
        "contact": "+91 94360-33402"
    },
    {
        "id": "VEH-SK-03",
        "name": "NER-MAT-309 (Border Infra Steel)",
        "cargo_type": "Construction Material & Steel",
        "cargo_category": "construction material",
        "cargo_weight_tons": 18.5,
        "origin": "Siliguri Freight Terminal",
        "destination": "Gangtok Smart City Depot",
        "corridor": "NH-10 Sevoke to Gangtok via Teesta Bazaar and Rangpo Gorge",
        "progress_pct": 58.0,
        "base_speed_kmh": 38.0,
        "driver": "D. Lepcha",
        "contact": "+91 94340-55603"
    },
    {
        "id": "VEH-MN-04",
        "name": "NER-AGRI-412 (Organic Harvest)",
        "cargo_type": "Agricultural Produce & Fruits",
        "cargo_category": "agricultural produce",
        "cargo_weight_tons": 8.0,
        "origin": "Imphal Market Yard",
        "destination": "Moreh ICP Cross-Border Terminal",
        "corridor": "NH-102 Imphal to Moreh Asian Highway Corridor",
        "progress_pct": 22.0,
        "base_speed_kmh": 45.0,
        "driver": "M. Singh",
        "contact": "+91 94361-77804"
    },
    {
        "id": "VEH-AR-05",
        "name": "NER-MED-503 (Dibang Valley Medical)",
        "cargo_type": "Medicines & First Aid Kits",
        "cargo_category": "medicines",
        "cargo_weight_tons": 4.5,
        "origin": "Pasighat District HQ",
        "destination": "Roing Community Health Centre",
        "corridor": "NH-13 Pasighat to Roing Dibang Valley Feeder",
        "progress_pct": 42.0,
        "base_speed_kmh": 46.0,
        "driver": "P. Megu",
        "contact": "+91 94362-99005"
    },
    {
        "id": "VEH-AS-06",
        "name": "NER-FOOD-615 (Brahmaputra Ration)",
        "cargo_type": "Food & Emergency Rations",
        "cargo_category": "food",
        "cargo_weight_tons": 12.0,
        "origin": "Guwahati FCI Depot",
        "destination": "Jorhat Storage Complex",
        "corridor": "NH-37 / NH-715 Guwahati to Dibrugarh via Kaziranga and Jorhat",
        "progress_pct": 71.0,
        "base_speed_kmh": 52.0,
        "driver": "R. Kalita",
        "contact": "+91 94351-22306"
    },
    {
        "id": "VEH-TR-07",
        "name": "NER-MAT-720 (Highway Precast)",
        "cargo_type": "Construction Material & Cement",
        "cargo_category": "construction material",
        "cargo_weight_tons": 16.0,
        "origin": "Bongaigaon Engineering Yard",
        "destination": "Guwahati Highway Authority Hub",
        "corridor": "NH-27 Siliguri Chicken's Neck to Guwahati East-West Corridor",
        "progress_pct": 65.0,
        "base_speed_kmh": 50.0,
        "driver": "H. Das",
        "contact": "+91 94352-44507"
    }
]

class FleetSimulationManager:
    """Manages simulated vehicle positions, movement, and dynamic risk-based stranding."""

    def __init__(self):
        self.vehicles = [dict(v) for v in INITIAL_VEHICLES]
        self.last_update_ts = time.time()
        self.tick_counter = 0

    def get_corridor_data(self, corridor_name: str) -> Optional[Dict[str, Any]]:
        if not _CORRIDOR_ROUTES:
            _init_corridor_routes()
        return _CORRIDOR_ROUTES.get(corridor_name)

    def advance_positions(self, step_delta_pct: Optional[float] = None):
        """
        Advances the route progress of vehicles that are NOT stranded.
        If a vehicle is stranded (High/Severe risk or blocked), it does not move.
        """
        now = time.time()
        elapsed = now - self.last_update_ts
        self.last_update_ts = now
        self.tick_counter += 1

        # Default step advance if not specified
        base_step = step_delta_pct if step_delta_pct is not None else min(3.0, max(0.5, elapsed * 0.2))

        # Import dynamic risk check function lazily to prevent circular imports
        from backend.routers.risk import compute_segment_dynamic_risk

        for v in self.vehicles:
            # Check current status before moving
            curr_info = self._resolve_vehicle_state(v, compute_segment_dynamic_risk)
            status = curr_info.get("status")

            if status == "stranded":
                # Stranded vehicle cannot advance along the highway
                continue
            elif status == "delayed":
                # Advances at half speed due to congestion/moderate weather
                v["progress_pct"] = (v.get("progress_pct", 0.0) + base_step * 0.45) % 100.0
            else:
                # Normal moving status
                v["progress_pct"] = (v.get("progress_pct", 0.0) + base_step) % 100.0

    def _resolve_vehicle_state(self, v: dict, compute_dynamic_risk_fn) -> dict:
        """
        Resolves the exact lat/lng, segment ID, and risk status for a vehicle.
        """
        corridor_name = v["corridor"]
        c_data = self.get_corridor_data(corridor_name)
        if not c_data or not c_data["waypoints"]:
            # Fallback coordinates if corridor data missing
            return {
                "lat": 26.15,
                "lng": 91.75,
                "segment_id": None,
                "segment_name": "Corridor Transit",
                "risk_tier": "Low",
                "status": "moving",
                "status_reason": "On-route normal transit"
            }

        waypoints = c_data["waypoints"]
        total_pts = len(waypoints)
        prog = max(0.0, min(100.0, v.get("progress_pct", 0.0)))
        
        # Determine index in waypoints list
        idx_float = (prog / 100.0) * (total_pts - 1)
        idx_base = int(idx_float)
        idx_next = min(idx_base + 1, total_pts - 1)
        ratio = idx_float - idx_base

        # Linear interpolation between waypoints
        p1 = waypoints[idx_base]
        p2 = waypoints[idx_next]
        cur_lat = round(p1[0] + (p2[0] - p1[0]) * ratio, 6)
        cur_lng = round(p1[1] + (p2[1] - p1[1]) * ratio, 6)

        # Find which segment contains this index
        curr_seg = None
        for (s_start, s_end, seg) in c_data["seg_ranges"]:
            if s_start <= idx_base <= s_end or s_start <= idx_next <= s_end:
                curr_seg = seg
                break
        if not curr_seg and c_data["segments"]:
            curr_seg = c_data["segments"][0]

        # Evaluate risk of this segment
        seg_risk = compute_dynamic_risk_fn(curr_seg) if curr_seg else {}
        tier = seg_risk.get("dynamic_alert_tier", "Low")
        is_blocked = bool(seg_risk.get("is_blocked", False))

        # Status determination according to PS requirements:
        # "stranded if it's on a segment whose risk tier just became High/Severe"
        if is_blocked or tier in ["High", "Very High", "Severe"]:
            status = "stranded"
            status_reason = f"Stranded on {curr_seg.get('name', 'Segment')}: {tier} landslide hazard risk"
            speed = 0.0
            # ETA delayed by stranded backlog
            rem_km = (1.0 - prog / 100.0) * 150.0
            eta_mins = int((rem_km / 35.0) * 60.0 + 360) # +6 hours stranding delay
        elif tier == "Moderate":
            status = "delayed"
            status_reason = f"Weather slowdown on {curr_seg.get('name', 'Segment')}: Moderate caution tier"
            speed = round(v.get("base_speed_kmh", 45.0) * 0.55, 1)
            rem_km = (1.0 - prog / 100.0) * 150.0
            eta_mins = int((rem_km / max(15.0, speed)) * 60.0 + 45)
        else:
            status = "moving"
            status_reason = "On-route normal transit: clear corridor"
            speed = float(v.get("base_speed_kmh", 48.0))
            rem_km = (1.0 - prog / 100.0) * 150.0
            eta_mins = int((rem_km / max(25.0, speed)) * 60.0)

        return {
            "lat": cur_lat,
            "lng": cur_lng,
            "segment_id": curr_seg.get("id") if curr_seg else None,
            "segment_name": curr_seg.get("name") if curr_seg else "Corridor Segment",
            "risk_tier": tier,
            "is_blocked": is_blocked,
            "status": status,
            "status_reason": status_reason,
            "speed_kmh": speed,
            "eta_minutes": max(10, eta_mins)
        }

    def get_fleet_snapshot(self, auto_advance: bool = True) -> Dict[str, Any]:
        """
        Returns full live snapshot of all fleet vehicles with real-time positions,
        cargo descriptions, and dynamic risk statuses.
        """
        if auto_advance:
            self.advance_positions()

        from backend.routers.risk import compute_segment_dynamic_risk

        fleet_list = []
        moving_count = 0
        delayed_count = 0
        stranded_count = 0

        for v in self.vehicles:
            st = self._resolve_vehicle_state(v, compute_segment_dynamic_risk)
            status = st["status"]
            if status == "moving":
                moving_count += 1
            elif status == "delayed":
                delayed_count += 1
            elif status == "stranded":
                stranded_count += 1

            c_data = self.get_corridor_data(v["corridor"])
            all_pts = c_data["waypoints"] if c_data else []
            step = max(1, len(all_pts) // 25)
            subsampled_route = all_pts[::step] if all_pts else []

            fleet_list.append({
                "id": v["id"],
                "name": v["name"],
                "cargo_type": v["cargo_type"],
                "cargo_category": v["cargo_category"],
                "cargo_weight_tons": v["cargo_weight_tons"],
                "origin": v["origin"],
                "destination": v["destination"],
                "assigned_route": f"{v['origin']} -> {v['destination']} ({v['corridor'].split()[0]})",
                "route": f"{v['origin']} -> {v['destination']}",
                "highway": v.get("highway") or v["corridor"].split()[0],
                "corridor": v["corridor"],
                "lat": st["lat"],
                "lng": st["lng"],
                "current_lat": st["lat"],
                "current_lng": st["lng"],
                "current_segment_id": st["segment_id"],
                "current_segment_name": st["segment_name"],
                "risk_tier": st["risk_tier"],
                "speed_kmh": st["speed_kmh"],
                "eta": f"{st['eta_minutes']} mins",
                "eta_minutes": st["eta_minutes"],
                "progress_pct": round(v.get("progress_pct", 0.0), 1),
                "status": status,
                "status_reason": st["status_reason"],
                "driver": v.get("driver"),
                "contact": v.get("contact"),
                "route_waypoints": subsampled_route
            })

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "simulation_mode": "server_tick",
            "summary": {
                "total_vehicles": len(self.vehicles),
                "moving": moving_count,
                "delayed": delayed_count,
                "stranded": stranded_count
            },
            "vehicles": fleet_list
        }

    def get_bottlenecks(self) -> Dict[str, Any]:
        """
        Analyzes logistics pressure points across the road network.
        Identifies road segments where commercial and relief vehicles are delayed,
        stranded, or funneling through high-risk landslide zones.
        """
        snapshot = self.get_fleet_snapshot(auto_advance=False)
        vehicles = snapshot.get("vehicles", [])

        from backend.routers.risk import compute_segment_dynamic_risk
        from backend.data.seed_ner_data import ROAD_SEGMENTS

        # Segment -> list of vehicles currently situated on it
        seg_vehicle_map: Dict[str, List[dict]] = {}
        for v in vehicles:
            sid = v.get("current_segment_id")
            if sid:
                seg_vehicle_map.setdefault(sid, []).append(v)

        bottlenecks = []
        for seg in ROAD_SEGMENTS:
            sid = seg["id"]
            vehs_on_seg = seg_vehicle_map.get(sid, [])
            seg_risk = compute_segment_dynamic_risk(seg)
            tier = seg_risk.get("dynamic_alert_tier", "Low")
            is_blocked = bool(seg_risk.get("is_blocked", False))

            # A bottleneck is relevant if vehicles are present OR if segment is High/Severe on a major highway
            if not vehs_on_seg and tier not in ["High", "Very High", "Severe"] and not is_blocked:
                continue

            stranded_on_seg = [v for v in vehs_on_seg if v.get("status") == "stranded"]
            delayed_on_seg = [v for v in vehs_on_seg if v.get("status") == "delayed"]
            moving_on_seg = [v for v in vehs_on_seg if v.get("status") == "moving"]

            # Calculate pressure score (0 - 100)
            base_hazard_pts = 45 if is_blocked else (40 if tier == "Severe" else (30 if tier == "Very High" else (18 if tier == "High" else 5)))
            vehicle_pts = len(stranded_on_seg) * 25 + len(delayed_on_seg) * 12 + len(moving_on_seg) * 4
            cargo_urgency_pts = 0
            for v in vehs_on_seg:
                if v.get("cargo_category") == "medicines":
                    cargo_urgency_pts += 15
                elif v.get("cargo_category") == "food":
                    cargo_urgency_pts += 10
                elif v.get("cargo_category") == "construction material":
                    cargo_urgency_pts += 6

            total_score = min(100.0, round(base_hazard_pts + vehicle_pts + cargo_urgency_pts, 1))

            if total_score < 25.0 and not vehs_on_seg:
                continue

            # Urgency level classification
            if is_blocked or len(stranded_on_seg) > 0 or total_score >= 70.0:
                pressure_level = "CRITICAL"
                action = f"Immediate bypass dispatch: Divert relief convoys via railhead / NW-2 barge. Prioritize BRO debris clearance on {seg.get('name', 'Segment')}."
            elif len(delayed_on_seg) > 0 or total_score >= 45.0:
                pressure_level = "ELEVATED"
                action = f"Traffic metering advisory: High risk of congestion backlog. Enforce staggered convoy dispatch."
            else:
                pressure_level = "MONITORED"
                action = f"Standard clearance monitoring: Keep corridor under real-time observation."

            bottlenecks.append({
                "segment_id": sid,
                "segment_name": seg.get("name", sid),
                "highway": seg.get("highway") or "National Highway",
                "corridor": seg.get("corridor") or seg.get("highway", "Corridor"),
                "risk_tier": tier,
                "is_blocked": is_blocked,
                "pressure_score": total_score,
                "pressure_level": pressure_level,
                "total_vehicles_present": len(vehs_on_seg),
                "stranded_vehicles_count": len(stranded_on_seg),
                "delayed_vehicles_count": len(delayed_on_seg),
                "moving_vehicles_count": len(moving_on_seg),
                "cargo_types_affected": list(set(v["cargo_type"] for v in vehs_on_seg)),
                "vehicles_detail": [
                    {
                        "id": v["id"],
                        "name": v["name"],
                        "cargo_type": v["cargo_type"],
                        "cargo_category": v["cargo_category"],
                        "status": v["status"],
                        "destination": v["destination"],
                        "eta_minutes": v["eta_minutes"]
                    }
                    for v in vehs_on_seg
                ],
                "recommended_mitigation": action
            })

        # Sort descending by pressure score
        bottlenecks.sort(key=lambda x: x["pressure_score"], reverse=True)

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": {
                "total_tracked_vehicles": len(vehicles),
                "on_time_count": sum(1 for v in vehicles if v.get("status") == "moving"),
                "delayed_count": sum(1 for v in vehicles if v.get("status") == "delayed"),
                "stranded_count": sum(1 for v in vehicles if v.get("status") == "stranded"),
                "total_bottlenecks_identified": len(bottlenecks),
                "critical_bottlenecks_count": sum(1 for b in bottlenecks if b["pressure_level"] == "CRITICAL")
            },
            "bottlenecks": bottlenecks[:10] # Top 10 logistics pressure points
        }


# Singleton simulation instance
fleet_manager = FleetSimulationManager()

def get_fleet_vehicles(auto_advance: bool = True) -> Dict[str, Any]:
    return fleet_manager.get_fleet_snapshot(auto_advance=auto_advance)

def get_fleet_bottlenecks() -> Dict[str, Any]:
    return fleet_manager.get_bottlenecks()

def advance_fleet_tick():
    fleet_manager.advance_positions(step_delta_pct=2.0)


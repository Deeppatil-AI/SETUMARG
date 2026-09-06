"""
Setumarg: Fleet Router
GPS-based Vehicle Tracking & Telematics Simulation (PS26002 Requirement d).
Monitors commercial and relief transport convoys (medicines, food, materials, produce)
along critical North Eastern corridors and detects stranding caused by landslides.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging

from backend.services.fleet_service import (
    get_fleet_vehicles,
    get_fleet_bottlenecks,
    advance_fleet_tick,
    fleet_manager
)

logger = logging.getLogger("setumarg.fleet")

router = APIRouter(prefix="/api/fleet", tags=["Fleet Tracking & GPS Telematics"])


@router.get("/bottlenecks")
def list_logistics_bottlenecks():
    """
    Returns high-priority supply chain bottlenecks across the NER highway network (PS26002 point g).
    Identifies segments with concentrated delayed or stranded freight, critical cargoes affected,
    and recommended multi-modal or detour mitigation actions.
    """
    try:
        data = get_fleet_bottlenecks()
        return data
    except Exception as exc:
        logger.error(f"Error computing fleet bottlenecks: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/vehicles")
def list_fleet_vehicles(advance: bool = Query(True, description="Whether to advance simulated positions on request")):
    """
    Returns real-time GPS tracking snapshot for the simulated fleet.
    Each vehicle includes ID, cargo type, category, weight, route, origin, destination,
    current lat/lng, speed, ETA, and status (moving / delayed / stranded).
    Stranded status is dynamically triggered when a vehicle encounters a physically blocked segment, Severe alert tier, or critical canyon hazard.
    """
    try:
        data = get_fleet_vehicles(auto_advance=advance)
        return data
    except Exception as exc:
        logger.error(f"Error fetching fleet snapshot: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/advance")
def trigger_fleet_step():
    """Manually advance fleet movement by one simulation tick."""
    try:
        advance_fleet_tick()
        return {"status": "ADVANCED", "message": "Fleet movement advanced by 1 simulation step."}
    except Exception as exc:
        logger.error(f"Error advancing fleet tick: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/vehicles/{vehicle_id}")
def get_vehicle_by_id(vehicle_id: str):
    """Returns real-time tracking data for an individual vehicle."""
    snapshot = get_fleet_vehicles(auto_advance=False)
    for v in snapshot.get("vehicles", []):
        if v["id"] == vehicle_id:
            return v
    raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found in active fleet")

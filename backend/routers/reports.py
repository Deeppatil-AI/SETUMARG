"""
Setumarg: Crowdsourced Hazard Reporting Router
Modeled on NASA LHASA's 'Landslide Reporter' citizen-science validation program.
Allows on-the-ground drivers, BRO personnel, and local villagers to log blockages with instant map updates.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

from backend.routers.risk import CURRENT_RAINFALL_STATE
from backend.data.seed_ner_data import ROAD_SEGMENTS

router = APIRouter(prefix="/api/reports", tags=["Crowdsourced Hazard Reports"])

# In-memory storage of hazard reports
HAZARD_REPORTS = [
    {
        "id": "REP-2026-001",
        "segment_id": "SEG-NH44-02",
        "segment_name": "Jowai-Sonapur Tunnel-Ratacherra Landslide Corridor",
        "highway": "NH-6 / NH-44",
        "lat": 25.1098,
        "lng": 92.3987,
        "hazard_type": "Debris Flow / Mudslide",
        "severity": "Critical",
        "description": "Heavy sludge accumulation blocking south portal of Sonapur tunnel. Traffic halted both sides.",
        "reported_by": "Assam Rifles Patrol / Local Transporter",
        "timestamp": "2026-09-04T17:15:00Z",
        "status": "Verified",
        "is_impassable": True,
        "photo_url": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80"
    },
    {
        "id": "REP-2026-002",
        "segment_id": "SEG-NH10-01",
        "segment_name": "Sevoke-Teesta Bazaar-Rangpo Gangtok Corridor",
        "highway": "NH-10",
        "lat": 27.0543,
        "lng": 88.4312,
        "hazard_type": "Rockfall & River Swell",
        "severity": "Moderate",
        "description": "Loose boulders near 29th Mile. Single lane movement with escorts.",
        "reported_by": "BRO Shivalik Project Worker",
        "timestamp": "2026-09-04T16:40:00Z",
        "status": "Verified",
        "is_impassable": False,
        "photo_url": "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80"
    }
]

# Initialize default override from seed verified report
for sid in ["SEG-NH44-02", "SEG-NH-6-NH-44-57", "SEG-NH-6-NH-44-58", "SEG-NH-6-NH-44-59"]:
    CURRENT_RAINFALL_STATE["hazard_overrides"][sid] = {
        "is_blocked": True,
        "severity": "Critical",
        "description": "Confirmed mudslide blocking Sonapur tunnel portal."
    }


class HazardReportCreate(BaseModel):
    segment_id: Optional[str] = None
    lat: float
    lng: float
    hazard_type: str # Mudslide, Rockfall, Flash Flood, Road Subsidence, Bridge Inundation
    severity: str    # Minor, Moderate, Critical, Impassable
    description: str
    reported_by: Optional[str] = "Citizen / Commercial Driver"
    photo_url: Optional[str] = None


@router.get("")
def list_hazard_reports():
    """
    Returns all crowdsourced hazard reports sorted by latest timestamp.
    """
    return {
        "count": len(HAZARD_REPORTS),
        "reports": sorted(HAZARD_REPORTS, key=lambda r: r["timestamp"], reverse=True)
    }


@router.post("")
def submit_hazard_report(report: HazardReportCreate):
    """
    Submits a new crowdsourced hazard report (NASA LHASA Landslide Reporter style).
    If severity is Critical or Impassable, immediately elevates the road segment's risk alert tier to Severe/Blocked.
    """
    # Locate closest road segment if not explicitly passed
    matched_segment_id = report.segment_id
    matched_segment_name = "NER Trunk Corridor"
    matched_highway = "State Highway / PMGSY Link"

    if not matched_segment_id:
        # Distance heuristic to find closest road segment
        best_dist = 999999.0
        for seg in ROAD_SEGMENTS:
            for coord in seg["coordinates"]:
                d = ((coord[0] - report.lat)**2 + (coord[1] - report.lng)**2)**0.5
                if d < best_dist:
                    best_dist = d
                    matched_segment_id = seg["id"]
                    matched_segment_name = seg["name"]
                    matched_highway = seg["highway"]
    else:
        seg = next((s for s in ROAD_SEGMENTS if s["id"] == matched_segment_id), None)
        if seg:
            matched_segment_name = seg["name"]
            matched_highway = seg["highway"]

    is_impassable = report.severity in ["Critical", "Impassable"]

    new_entry = {
        "id": f"REP-2026-{len(HAZARD_REPORTS) + 1:03d}",
        "segment_id": matched_segment_id,
        "segment_name": matched_segment_name,
        "highway": matched_highway,
        "lat": report.lat,
        "lng": report.lng,
        "hazard_type": report.hazard_type,
        "severity": report.severity,
        "description": report.description,
        "reported_by": report.reported_by,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "Verified" if is_impassable else "Pending BRO Inspection",
        "is_impassable": is_impassable,
        "photo_url": report.photo_url if report.photo_url else "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80"
    }

    HAZARD_REPORTS.append(new_entry)

    # Trigger instant real-time risk overlay update
    if is_impassable and matched_segment_id:
        CURRENT_RAINFALL_STATE["hazard_overrides"][matched_segment_id] = {
            "is_blocked": True,
            "severity": report.severity,
            "description": f"Crowdsourced Alert: {report.description}"
        }

    return {
        "status": "Report successfully recorded",
        "report": new_entry,
        "affected_segment": matched_segment_id,
        "instant_map_updated": is_impassable
    }


class OfflineSyncRequest(BaseModel):
    reports: List[HazardReportCreate]


@router.post("/sync-offline")
def sync_offline_reports(payload: OfflineSyncRequest):
    """
    Synchronizes field reports collected while offline (PS26002 point h).
    Applies real-time hazard elevations for any impassable reports in batch.
    """
    synced = []
    for rep in payload.reports:
        res = submit_hazard_report(rep)
        synced.append(res["report"])

    return {
        "status": "SYNC_SUCCESSFUL",
        "synced_count": len(synced),
        "synced_reports": synced
    }

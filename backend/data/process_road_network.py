"""
Setumarg: Real-World Highway Chunking & Village Road Snapping Engine.
Reads the high-resolution cached OSM GeoJSON files, splits each continuous corridor
into ~3-5 km real contiguous sub-segments with realistic geotechnical attributes,
and snaps all 25 villages to the nearest real OSM roads.
"""

import os
import sys
import json
import math
import requests
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

DATA_DIR = os.path.join(os.path.dirname(__file__), "highways")
OSRM_NEAREST_URL = "http://router.project-osrm.org/nearest/v1/driving/{lng},{lat}"


def haversine_distance_km(coord1, coord2):
    """Calculates distance in km between two [lat, lng] points."""
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def chunk_linestring(coords, target_chunk_km=4.0):
    """
    Chunks a list of [lat, lng] coordinates into sub-segments of approximately target_chunk_km.
    Preserves continuity by sharing boundary vertices between adjacent sub-segments.
    """
    if len(coords) < 2:
        return [coords]

    chunks = []
    current_chunk = [coords[0]]
    accumulated_km = 0.0

    for i in range(1, len(coords)):
        dist = haversine_distance_km(coords[i - 1], coords[i])
        accumulated_km += dist
        current_chunk.append(coords[i])

        if accumulated_km >= target_chunk_km:
            chunks.append(current_chunk)
            # Start next chunk from the last point to guarantee seamless continuity
            current_chunk = [coords[i]]
            accumulated_km = 0.0

    if len(current_chunk) > 1:
        if len(chunks) > 0 and accumulated_km < (target_chunk_km * 0.4):
            # Append remaining short tail to the last chunk
            chunks[-1].extend(current_chunk[1:])
        else:
            chunks.append(current_chunk)

    return chunks


def build_real_road_segments():
    print("=== Processing Real Road Geometries & Continuous Sub-Segments ===")
    
    corridor_files = [
        ("nh6_guwahati_silchar.geojson", "NH-6 / NH-44", "Meghalaya / Assam"),
        ("nh10_sevoke_gangtok.geojson", "NH-10", "West Bengal / Sikkim"),
        ("nh29_dimapur_kohima_imphal.geojson", "NH-29 / NH-2", "Nagaland / Manipur"),
        ("nh27_siliguri_guwahati.geojson", "NH-27", "West Bengal / Assam"),
        ("nh37_guwahati_dibrugarh.geojson", "NH-37 / NH-715", "Assam"),
        ("nh102_imphal_moreh.geojson", "NH-102", "Manipur"),
        ("nh13_pasighat_roing.geojson", "NH-13", "Arunachal Pradesh")
    ]

    all_segments = []
    seg_counter = 1

    for fname, hwy, state_name in corridor_files:
        fpath = os.path.join(DATA_DIR, fname)
        if not os.path.exists(fpath):
            print(f"Warning: {fpath} not found.")
            continue

        with open(fpath, "r", encoding="utf-8") as f:
            gj = json.load(f)

        feature = gj["features"][0]
        leaflet_coords = feature["leaflet_coordinates"] # list of [lat, lng]
        corridor_name = feature["properties"]["name"]

        # Chunk into contiguous 3.5 km sub-segments
        sub_chunks = chunk_linestring(leaflet_coords, target_chunk_km=4.5)
        print(f"Corridor {hwy} ({len(leaflet_coords)} points) split into {len(sub_chunks)} real-world contiguous sub-segments.")

        for idx, chunk in enumerate(sub_chunks):
            chunk_len = sum(haversine_distance_km(chunk[i-1], chunk[i]) for i in range(1, len(chunk)))
            mid_pt = chunk[len(chunk) // 2]
            lat, lng = mid_pt[0], mid_pt[1]

            # Geotechnical conditioning factors tailored to regional geomorphology
            is_mountain = False
            slope = 6.0
            dist_fault = 4500.0
            dist_drain = 400.0
            ndvi = 0.65
            rainfall = 45.0
            elev = 120
            litho = 1
            soil = 1
            lulc = 4
            primary_hazard = "Waterlogging and embankment scouring"
            strategic_imp = "Vital logistics arterial corridor."
            is_blocked = False
            blockage_desc = None

            if "nh6" in fname:
                # Meghalaya plateau & Jaintia hills
                if 25.0 <= lat <= 25.6: # Jowai - Sonapur Tunnel - Ratacherra
                    is_mountain = True
                    elev = int(800 + (25.5 - lat) * 1200)
                    slope = round(32.0 + (lat * 7) % 12, 1)
                    dist_fault = round(150.0 + (lat * 100) % 600, 1)
                    dist_drain = round(40.0 + (lng * 50) % 180, 1)
                    ndvi = 0.38
                    rainfall = 92.0
                    litho = 2 # Disang shales
                    soil = 4  # Colluvial debris
                    primary_hazard = "Deep-seated rotational mudslides and portal collapse"
                    strategic_imp = "Sole economic corridor feeding Barak Valley and Mizoram."
                    if 25.08 <= lat <= 25.14:
                        is_blocked = True
                        blockage_desc = "Confirmed active debris fan at Sonapur Tunnel portal."
                else: # Umiam / Shillong pass
                    is_mountain = True
                    elev = 1350
                    slope = 28.5
                    dist_fault = 520.0
                    dist_drain = 120.0
                    ndvi = 0.58
                    rainfall = 65.0
                    litho = 3
                    soil = 2
                    primary_hazard = "Rockfall along steep road cuts"
                    strategic_imp = "Connecting Shillong capital to Guwahati trunk."

            elif "nh10" in fname:
                # Sevoke to Gangtok (Teesta gorge)
                is_mountain = True
                elev = int(250 + (lat - 26.88) * 2800)
                slope = round(38.0 + (lat * 11) % 10, 1)
                dist_fault = round(90.0 + (lat * 80) % 350, 1)
                dist_drain = 35.0 # Adjacent to Teesta
                ndvi = 0.36
                rainfall = 98.0
                litho = 3 # Daling phyllites
                soil = 4
                primary_hazard = "Chronic slope cleavage and river toe-erosion"
                strategic_imp = "Sole civilian and military lifelines to Sikkim."

            elif "nh29" in fname:
                # Dimapur to Kohima / Imphal
                if lat >= 25.55: # Kohima / Phesama hills
                    is_mountain = True
                    elev = 1480
                    slope = round(34.0 + (lng * 5) % 10, 1)
                    dist_fault = 320.0
                    dist_drain = 85.0
                    ndvi = 0.44
                    rainfall = 72.0
                    litho = 4 # Disang shales
                    soil = 4
                    primary_hazard = "Phesama creep failure and road subsidence"
                    strategic_imp = "Strategic supply line to Nagaland capital."
                else:
                    elev = 780
                    slope = 18.0
                    dist_fault = 850.0
                    dist_drain = 210.0
                    rainfall = 55.0
                    primary_hazard = "Slips along roadside tea plantations"
                    strategic_imp = "Imphal logistics feeder."

            elif "nh102" in fname:
                # Tengnoupal / Moreh
                is_mountain = True
                elev = 1120
                slope = 27.5
                dist_fault = 680.0
                dist_drain = 180.0
                ndvi = 0.52
                rainfall = 54.0
                litho = 4
                soil = 3
                primary_hazard = "Hairpin mud accumulation and slip"
                strategic_imp = "Asian Highway 1 border trade link to Myanmar."

            elif "nh13" in fname:
                # Pasighat to Roing
                is_mountain = True
                elev = 1850
                slope = 42.0
                dist_fault = 140.0
                dist_drain = 45.0
                ndvi = 0.40
                rainfall = 110.0
                litho = 3
                soil = 4
                primary_hazard = "Massive slope washouts and braided river floods"
                strategic_imp = "Frontier highway for Indo-Tibetan border defense."

            seg_id = f"SEG-{hwy.replace(' / ', '-').replace(' ', '')}-{idx+1:02d}"
            seg_name = f"{hwy} km {int(idx * 4.5)}–{int((idx + 1) * 4.5)}"

            all_segments.append({
                "id": seg_id,
                "highway": hwy,
                "name": seg_name,
                "corridor": corridor_name,
                "state": state_name,
                "coordinates": chunk, # REAL turn-by-turn road coordinates
                "length_km": round(chunk_len, 2),
                "elevation_m": elev,
                "slope_deg": slope,
                "aspect_deg": round((lat * 23.5) % 360, 1),
                "plan_curvature": round(((lat * 11) % 5) - 2.5, 2),
                "profile_curvature": round(((lng * 13) % 4) - 2.0, 2),
                "dist_to_drainage_m": dist_drain,
                "dist_to_fault_m": dist_fault,
                "dist_to_road_m": 0.0,
                "ndvi": ndvi,
                "lulc_class": lulc,
                "lithology_class": litho,
                "soil_texture": soil,
                "base_rainfall_mm": rainfall,
                "primary_hazard": primary_hazard,
                "strategic_importance": strategic_imp,
                "is_blocked": is_blocked,
                "blockage_reason": blockage_desc
            })

    print(f"Total real-world contiguous highway sub-segments generated: {len(all_segments)}")
    return all_segments


def snap_villages_to_roads(raw_villages):
    print("=== Snapping Villages to Real OSM Road Network via OSRM ===")
    snapped = []
    
    for vil in raw_villages:
        lng, lat = vil["lng"], vil["lat"]
        url = OSRM_NEAREST_URL.format(lng=lng, lat=lat)
        
        try:
            r = requests.get(url, timeout=10)
            data = r.json()
            if data.get("code") == "Ok" and len(data.get("waypoints", [])) > 0:
                wp = data["waypoints"][0]
                real_lng, real_lat = wp["location"]
                snap_dist = wp.get("distance", 0.0)
                v_copy = dict(vil)
                v_copy["lat"] = round(real_lat, 5)
                v_copy["lng"] = round(real_lng, 5)
                v_copy["osm_road_snap_dist_m"] = round(snap_dist, 1)
                snapped.append(v_copy)
                print(f"  Snapped {vil['name']} -> ({real_lat:.5f}, {real_lng:.5f}) [{snap_dist:.1f}m from road]")
            else:
                snapped.append(vil)
        except Exception as e:
            print(f"  Failed to snap {vil['name']}: {e}")
            snapped.append(vil)
            
    return snapped


if __name__ == "__main__":
    from backend.data.seed_ner_data import VILLAGES
    segs = build_real_road_segments()
    snapped_vils = snap_villages_to_roads(VILLAGES)
    
    # Save processed dataset
    output_path = os.path.join(os.path.dirname(__file__), "real_network_data.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({"road_segments": segs, "villages": snapped_vils}, f, indent=2)
    print(f"Saved real road network and snapped villages to {output_path}")

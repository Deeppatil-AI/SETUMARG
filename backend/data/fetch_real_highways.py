"""
Setumarg: Real-World Highway Geometry Fetcher & Cache Builder.
Queries OpenStreetMap / OSRM routing engine to fetch real, turn-by-turn road geometries
across the Eastern Himalaya corridors (NH-6/44, NH-10, NH-29, NH-27, NH-37, NH-102, NH-13).
Caches results locally to backend/data/highways/<corridor_id>.geojson.
"""

import os
import json
import time
import requests

DATA_DIR = os.path.join(os.path.dirname(__file__), "highways")
os.makedirs(DATA_DIR, exist_ok=True)

OSRM_ROUTE_URL = "http://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=geojson"
OSRM_NEAREST_URL = "http://router.project-osrm.org/nearest/v1/driving/{lng},{lat}"

CORRIDORS = {
    "nh6_guwahati_silchar": {
        "name": "NH-6 / NH-44 Guwahati to Silchar via Shillong and Sonapur Tunnel",
        "highway": "NH-6 / NH-44",
        "waypoints": [
            [26.1445, 91.7362], # Guwahati
            [26.1030, 91.8760], # Jorabat
            [25.9030, 91.8810], # Nongpoh
            [25.7520, 91.8950], # Umsning
            [25.5788, 91.8933], # Shillong
            [25.4412, 92.2045], # Jowai
            [25.3520, 92.3680], # Khliehriat
            [25.1098, 92.3987], # Sonapur Slide Tunnel
            [24.9876, 92.4876], # Ratacherra
            [24.9750, 92.5710], # Kalain
            [24.8333, 92.7789]  # Silchar
        ]
    },
    "nh10_sevoke_gangtok": {
        "name": "NH-10 Sevoke to Gangtok via Teesta Bazaar and Rangpo Gorge",
        "highway": "NH-10",
        "waypoints": [
            [26.8854, 88.4721], # Sevoke
            [26.9320, 88.4550], # Kalijhora
            [27.0543, 88.4312], # Teesta Bazaar
            [27.0912, 88.4560], # Melli
            [27.1765, 88.5234], # Rangpo
            [27.2340, 88.4980], # Singtam
            [27.3314, 88.6138]  # Gangtok
        ]
    },
    "nh29_dimapur_kohima_imphal": {
        "name": "NH-29 / NH-2 Dimapur to Kohima and Imphal via Phesama",
        "highway": "NH-29 / NH-2",
        "waypoints": [
            [25.9067, 93.7278], # Dimapur
            [25.7890, 93.7710], # Chümoukedima
            [25.7560, 93.8540], # Medziphema
            [25.6743, 94.1089], # Kohima
            [25.6120, 94.1020], # Phesama Slide Area
            [25.5120, 94.1250], # Mao
            [25.2650, 94.0210], # Senapati
            [25.1450, 93.9780], # Kangpokpi
            [24.8170, 93.9368]  # Imphal
        ]
    },
    "nh27_siliguri_guwahati": {
        "name": "NH-27 Siliguri Chicken's Neck to Guwahati East-West Corridor",
        "highway": "NH-27",
        "waypoints": [
            [26.7271, 88.3953], # Siliguri
            [26.5412, 88.7123], # Jalpaiguri
            [26.5980, 89.0120], # Dhupguri
            [26.5280, 89.2010], # Falakata
            [26.4910, 89.5280], # Alipurduar
            [26.4812, 90.5643], # Bongaigaon
            [26.4450, 91.4390], # Nalbari
            [26.1445, 91.7362]  # Guwahati
        ]
    },
    "nh37_guwahati_dibrugarh": {
        "name": "NH-37 / NH-715 Guwahati to Dibrugarh via Kaziranga and Jorhat",
        "highway": "NH-37 / NH-715",
        "waypoints": [
            [26.1445, 91.7362], # Guwahati
            [26.1210, 92.2150], # Jagiroad
            [26.3500, 92.6800], # Nagaon
            [26.5910, 93.0120], # Jakhalabandha
            [26.5890, 93.4120], # Kaziranga (Kohora)
            [26.6212, 93.6089], # Bokakhat
            [26.6123, 93.7543], # Numaligarh
            [26.6980, 93.9710], # Dergaon
            [26.7540, 94.2180], # Jorhat
            [26.9850, 94.6340], # Sibsagar
            [27.4728, 94.9120]  # Dibrugarh
        ]
    },
    "nh102_imphal_moreh": {
        "name": "NH-102 Imphal to Moreh Asian Highway Corridor",
        "highway": "NH-102",
        "waypoints": [
            [24.8170, 93.9368], # Imphal
            [24.6410, 93.9980], # Thoubal
            [24.5120, 94.0120], # Kakching Lamkhai
            [24.4520, 94.0540], # Pallel
            [24.3890, 94.1450], # Tengnoupal
            [24.2456, 94.3056]  # Moreh
        ]
    },
    "nh13_pasighat_roing": {
        "name": "NH-13 Pasighat to Roing Dibang Valley Feeder",
        "highway": "NH-13",
        "waypoints": [
            [28.0667, 95.3333], # Pasighat
            [28.0210, 95.4210], # Mebo
            [28.1450, 95.6540], # Dambuk
            [28.1450, 95.8450]  # Roing
        ]
    },
    "safe_bypass_guwahati_silchar": {
        "name": "Setumarg Fortified Valley Bypass via Lumding and Haflong",
        "highway": "NH-27 / NH-54 bypass",
        "waypoints": [
            [26.1445, 91.7362], # Guwahati
            [26.3500, 92.6800], # Nagaon
            [25.7500, 93.1800], # Lumding
            [25.1800, 93.0200], # Haflong
            [24.8333, 92.7789]  # Silchar
        ]
    }
}


def fetch_and_cache_corridors():
    print("=== Fetching Real OpenStreetMap Highway Geometries via OSRM ===")
    
    for cid, meta in CORRIDORS.items():
        cache_file = os.path.join(DATA_DIR, f"{cid}.geojson")
        
        # Build coordinates query string for OSRM: lng,lat;lng,lat...
        coord_pairs = [f"{pt[1]:.5f},{pt[0]:.5f}" for pt in meta["waypoints"]]
        coords_str = ";".join(coord_pairs)
        url = OSRM_ROUTE_URL.format(coords=coords_str)
        
        try:
            print(f"Fetching {meta['highway']} ({meta['name']})...")
            resp = requests.get(url, timeout=20)
            data = resp.json()
            
            if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
                route = data["routes"][0]
                geometry = route["geometry"] # GeoJSON LineString coordinates [[lng, lat], ...]
                raw_coords = geometry["coordinates"]
                distance_km = round(route["distance"] / 1000.0, 1)
                duration_hrs = round(route["duration"] / 3600.0, 2)
                
                # Convert to [lat, lng] format for Leaflet
                lat_lng_coords = [[pt[1], pt[0]] for pt in raw_coords]
                
                geojson_content = {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "properties": {
                                "id": cid,
                                "name": meta["name"],
                                "highway": meta["highway"],
                                "distance_km": distance_km,
                                "duration_hrs": duration_hrs,
                                "point_count": len(lat_lng_coords)
                            },
                            "geometry": {
                                "type": "LineString",
                                "coordinates": raw_coords # [lng, lat] GeoJSON standard
                            },
                            "leaflet_coordinates": lat_lng_coords # [lat, lng]
                        }
                    ]
                }
                
                with open(cache_file, "w", encoding="utf-8") as f:
                    json.dump(geojson_content, f, indent=2)
                
                print(f"  -> SUCCESS: Saved {len(lat_lng_coords)} real road points ({distance_km} km) to {cid}.geojson")
            else:
                print(f"  -> ERROR from OSRM: {data.get('code')}")
        except Exception as e:
            print(f"  -> EXCEPTION while fetching {cid}: {e}")
        
        time.sleep(0.5) # Courtesy pause for OSRM public API

    print("=== Highway Extraction Complete ===")


if __name__ == "__main__":
    fetch_and_cache_corridors()

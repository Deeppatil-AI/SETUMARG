"""
Setumarg: Live Weather Ingestion Service
Fetches real-time current conditions and short-term forecast rainfall data across
North Eastern Region (NER) district and corridor centroids using Open-Meteo's free public API.
Caches values to disk with robust offline fallback to guarantee continuous operation.
"""

import os
import json
import math
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import requests

logger = logging.getLogger("setumarg.weather")

# Canonical meteorological and corridor centroids across NER
# Spans all 7 monitored highway corridors (NH-6/44, NH-10, NH-29/2, NH-27, NH-37, NH-102, NH-13)
# and all 25 rural connectivity villages.
DISTRICT_CENTROIDS = [
    {"id": "DIST-KAMRUP-METRO", "district": "Kamrup Metropolitan (Guwahati)", "state": "Assam", "lat": 26.18, "lng": 91.75},
    {"id": "DIST-RI-BHOI", "district": "Ri-Bhoi (Nongpoh)", "state": "Meghalaya", "lat": 25.90, "lng": 91.88},
    {"id": "DIST-EAST-KHASI", "district": "East Khasi Hills (Shillong)", "state": "Meghalaya", "lat": 25.57, "lng": 91.88},
    {"id": "DIST-WEST-JAINTIA", "district": "West Jaintia Hills (Jowai)", "state": "Meghalaya", "lat": 25.45, "lng": 92.20},
    {"id": "DIST-EAST-JAINTIA", "district": "East Jaintia Hills (Sonapur)", "state": "Meghalaya", "lat": 25.11, "lng": 92.39},
    {"id": "DIST-CACHAR", "district": "Cachar (Silchar)", "state": "Assam", "lat": 24.83, "lng": 92.80},
    {"id": "DIST-DARJEELING", "district": "Darjeeling (Siliguri)", "state": "West Bengal", "lat": 26.72, "lng": 88.42},
    {"id": "DIST-JALPAIGURI", "district": "Jalpaiguri (Sevoke)", "state": "West Bengal", "lat": 26.88, "lng": 88.47},
    {"id": "DIST-KALIMPONG", "district": "Kalimpong", "state": "West Bengal", "lat": 27.06, "lng": 88.47},
    {"id": "DIST-PAKYONG", "district": "Pakyong (Rangpo)", "state": "Sikkim", "lat": 27.18, "lng": 88.53},
    {"id": "DIST-EAST-SIKKIM", "district": "East Sikkim (Gangtok)", "state": "Sikkim", "lat": 27.33, "lng": 88.61},
    {"id": "DIST-DIMAPUR", "district": "Dimapur", "state": "Nagaland", "lat": 25.91, "lng": 93.73},
    {"id": "DIST-CHUMUKEDIMA", "district": "Chumukedima", "state": "Nagaland", "lat": 25.79, "lng": 93.77},
    {"id": "DIST-KOHIMA", "district": "Kohima", "state": "Nagaland", "lat": 25.67, "lng": 94.11},
    {"id": "DIST-SENAPATI", "district": "Senapati", "state": "Manipur", "lat": 25.27, "lng": 94.02},
    {"id": "DIST-KANGPOKPI", "district": "Kangpokpi", "state": "Manipur", "lat": 25.15, "lng": 93.97},
    {"id": "DIST-IMPHAL-WEST", "district": "Imphal West (Imphal)", "state": "Manipur", "lat": 24.81, "lng": 93.94},
    {"id": "DIST-THOUBAL", "district": "Thoubal", "state": "Manipur", "lat": 24.63, "lng": 94.01},
    {"id": "DIST-KAKCHING", "district": "Kakching", "state": "Manipur", "lat": 24.49, "lng": 93.98},
    {"id": "DIST-TENGNOUPAL", "district": "Tengnoupal", "state": "Manipur", "lat": 24.40, "lng": 94.15},
    {"id": "DIST-CHANDEL", "district": "Chandel (Moreh)", "state": "Manipur", "lat": 24.25, "lng": 94.30},
    {"id": "DIST-ALIPURDUAR", "district": "Alipurduar", "state": "West Bengal", "lat": 26.49, "lng": 89.53},
    {"id": "DIST-KOKRAJHAR", "district": "Kokrajhar", "state": "Assam", "lat": 26.40, "lng": 90.27},
    {"id": "DIST-BONGAIGAON", "district": "Bongaigaon", "state": "Assam", "lat": 26.50, "lng": 90.56},
    {"id": "DIST-BARPETA", "district": "Barpeta", "state": "Assam", "lat": 26.32, "lng": 91.00},
    {"id": "DIST-NAGAON", "district": "Nagaon", "state": "Assam", "lat": 26.35, "lng": 92.68},
    {"id": "DIST-GOLAGHAT", "district": "Golaghat (Kaziranga)", "state": "Assam", "lat": 26.52, "lng": 93.97},
    {"id": "DIST-JORHAT", "district": "Jorhat", "state": "Assam", "lat": 26.75, "lng": 94.22},
    {"id": "DIST-SIVASAGAR", "district": "Sivasagar", "state": "Assam", "lat": 26.98, "lng": 94.63},
    {"id": "DIST-DIBRUGARH", "district": "Dibrugarh", "state": "Assam", "lat": 27.48, "lng": 94.91},
    {"id": "DIST-TINSUKIA", "district": "Tinsukia", "state": "Assam", "lat": 27.50, "lng": 95.36},
    {"id": "DIST-EAST-SIANG", "district": "East Siang (Pasighat)", "state": "Arunachal Pradesh", "lat": 28.07, "lng": 95.33},
    {"id": "DIST-LOWER-DIBANG", "district": "Lower Dibang Valley (Roing)", "state": "Arunachal Pradesh", "lat": 28.14, "lng": 95.84}
]

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
CACHE_FILE = os.path.join(DATA_DIR, "weather_cache.json")
OPEN_METEO_API = "https://api.open-meteo.com/v1/forecast"

# In-memory weather cache
_WEATHER_MEMORY_CACHE: Dict[str, Any] = {}
_LAST_FETCH_TIME: Optional[str] = None


WMO_WEATHER_CODES = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great circle distance in km between two coordinate points."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def find_nearest_district(lat: float, lng: float) -> dict:
    """Finds the nearest monitored district centroid to the given coordinates."""
    nearest = min(DISTRICT_CENTROIDS, key=lambda d: haversine_km(lat, lng, d["lat"], d["lng"]))
    return nearest


def load_cached_weather_from_disk() -> Dict[str, Any]:
    """Loads previously saved weather cache from disk."""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict) and "districts" in data:
                    return data
        except Exception as e:
            logger.warning(f"Failed to read weather cache file: {e}")
    return {}


def save_weather_to_disk(data: Dict[str, Any]) -> None:
    """Persists weather data to local disk cache."""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.warning(f"Failed to save weather cache file: {e}")


def generate_baseline_fallback() -> Dict[str, Any]:
    """
    Generates a fallback baseline if both live API and disk cache are inaccessible.
    Uses calibrated regional seasonal baselines (e.g. active monsoon patterns in hill tracts).
    """
    now_utc = datetime.now(timezone.utc).isoformat()
    fallback_districts = {}

    for d in DISTRICT_CENTROIDS:
        # Hills receive higher seasonal baseline precipitation
        is_highland = any(h in d["district"] for h in ["Sonapur", "Jowai", "Shillong", "Kalimpong", "Gangtok", "Kohima"])
        base_rain = 3.5 if is_highland else 0.8
        base_precip = 4.2 if is_highland else 1.0

        hourly_fc = []
        for h in range(24):
            hourly_fc.append({
                "hour_offset": h,
                "precipitation_mm": round(base_precip * (0.8 + 0.4 * (h % 3)), 1),
                "rain_mm": round(base_rain * (0.8 + 0.4 * (h % 3)), 1)
            })

        fallback_districts[d["district"]] = {
            "id": d["id"],
            "district": d["district"],
            "state": d["state"],
            "lat": d["lat"],
            "lng": d["lng"],
            "current_rain_mm": base_rain,
            "current_precipitation_mm": base_precip,
            "weather_code": 61 if is_highland else 3,
            "weather_description": "Slight rain (Regional Baseline)" if is_highland else "Overcast (Regional Baseline)",
            "forecast_next_6h_mm": round(sum(item["precipitation_mm"] for item in hourly_fc[:6]), 1),
            "forecast_next_24h_mm": round(sum(item["precipitation_mm"] for item in hourly_fc[:24]), 1),
            "forecast_next_48h_mm": round(sum(item["precipitation_mm"] for item in hourly_fc[:24]) * 1.8, 1),
            "hourly_forecast": hourly_fc,
            "timestamp": now_utc,
            "source": "Calibrated Regional Seasonal Baseline (Offline Fallback)"
        }

    return {
        "status": "FALLBACK_BASELINE",
        "timestamp": now_utc,
        "source": "Calibrated Regional Seasonal Baseline (Offline Fallback)",
        "total_districts": len(fallback_districts),
        "districts": fallback_districts
    }


def fetch_live_weather(timeout: int = 12) -> Dict[str, Any]:
    """
    Fetches real-time current and 48-hour forecast rainfall for all NER district centroids
    from Open-Meteo in a single vectorized batch request.
    
    If the API call succeeds, stores the values in disk cache and in-memory cache.
    If the API call fails, falls back to the last successfully cached disk state.
    """
    global _WEATHER_MEMORY_CACHE, _LAST_FETCH_TIME

    lats_str = ",".join(f"{d['lat']:.4f}" for d in DISTRICT_CENTROIDS)
    lngs_str = ",".join(f"{d['lng']:.4f}" for d in DISTRICT_CENTROIDS)

    params = {
        "latitude": lats_str,
        "longitude": lngs_str,
        "current": "precipitation,rain,weather_code",
        "hourly": "precipitation,rain",
        "forecast_days": 2,
        "timezone": "auto"
    }

    now_utc = datetime.now(timezone.utc).isoformat()

    try:
        response = requests.get(OPEN_METEO_API, params=params, timeout=timeout)
        if response.status_code == 200:
            payload = response.json()
            # If multiple coordinates, Open-Meteo returns a list of results
            results_list = payload if isinstance(payload, list) else [payload]

            districts_data = {}
            for i, d in enumerate(DISTRICT_CENTROIDS):
                res = results_list[i] if i < len(results_list) else results_list[0]
                curr = res.get("current", {})
                hourly = res.get("hourly", {})

                current_rain = float(curr.get("rain", 0.0) or 0.0)
                current_precip = float(curr.get("precipitation", 0.0) or 0.0)
                wmo_code = int(curr.get("weather_code", 0) or 0)
                desc = WMO_WEATHER_CODES.get(wmo_code, "Variable precipitation")

                hourly_times = hourly.get("time", [])
                hourly_precip = hourly.get("precipitation", [])
                hourly_rain = hourly.get("rain", [])

                # Next 6 hours sum
                next_6h_mm = round(sum(float(p or 0.0) for p in hourly_precip[:6]), 1) if hourly_precip else 0.0
                # Next 24 hours sum
                next_24h_mm = round(sum(float(p or 0.0) for p in hourly_precip[:24]), 1) if hourly_precip else 0.0
                # Next 48 hours sum
                next_48h_mm = round(sum(float(p or 0.0) for p in hourly_precip[:48]), 1) if hourly_precip else 0.0

                # Formulate hourly objects for the next 24 hours
                hourly_forecast_items = []
                for h_idx in range(min(24, len(hourly_times))):
                    hourly_forecast_items.append({
                        "time": hourly_times[h_idx],
                        "precipitation_mm": round(float(hourly_precip[h_idx] or 0.0), 2) if h_idx < len(hourly_precip) else 0.0,
                        "rain_mm": round(float(hourly_rain[h_idx] or 0.0), 2) if h_idx < len(hourly_rain) else 0.0
                    })

                districts_data[d["district"]] = {
                    "id": d["id"],
                    "district": d["district"],
                    "state": d["state"],
                    "lat": d["lat"],
                    "lng": d["lng"],
                    "current_rain_mm": current_rain,
                    "current_precipitation_mm": current_precip,
                    "weather_code": wmo_code,
                    "weather_description": desc,
                    "forecast_next_6h_mm": next_6h_mm,
                    "forecast_next_24h_mm": next_24h_mm,
                    "forecast_next_48h_mm": next_48h_mm,
                    "hourly_forecast": hourly_forecast_items,
                    "timestamp": now_utc,
                    "source": "Open-Meteo Live API"
                }

            cache_payload = {
                "status": "LIVE_SYNCHRONIZED",
                "timestamp": now_utc,
                "source": "Open-Meteo Live API",
                "total_districts": len(districts_data),
                "districts": districts_data
            }

            # Save to disk and memory
            save_weather_to_disk(cache_payload)
            _WEATHER_MEMORY_CACHE = cache_payload
            _LAST_FETCH_TIME = now_utc
            logger.info(f"Successfully fetched live weather from Open-Meteo for {len(districts_data)} NER districts.")
            return cache_payload

        else:
            logger.warning(f"Open-Meteo API returned status {response.status_code}. Falling back to disk cache.")

    except Exception as exc:
        logger.warning(f"Network error connecting to Open-Meteo API: {exc}. Falling back to cached data.")

    # Fallback to disk cache
    cached = load_cached_weather_from_disk()
    if cached and "districts" in cached and len(cached["districts"]) > 0:
        cached["status"] = "CACHED_FALLBACK"
        _WEATHER_MEMORY_CACHE = cached
        return cached

    # Fallback to calibrated baseline if no disk cache exists
    fallback = generate_baseline_fallback()
    _WEATHER_MEMORY_CACHE = fallback
    return fallback


def get_current_weather(auto_refresh: bool = False) -> Dict[str, Any]:
    """
    Returns current weather state.
    Uses in-memory cache if populated, else loads disk cache or fetches live.
    """
    global _WEATHER_MEMORY_CACHE

    if auto_refresh or not _WEATHER_MEMORY_CACHE:
        # If memory is empty, check disk first
        disk_data = load_cached_weather_from_disk()
        if disk_data and "districts" in disk_data and not auto_refresh:
            _WEATHER_MEMORY_CACHE = disk_data
        else:
            return fetch_live_weather()

    return _WEATHER_MEMORY_CACHE


def get_weather_for_coordinate(lat: float, lng: float) -> dict:
    """
    Returns the live or cached weather observation and forecast for the nearest district centroid.
    """
    nearest = find_nearest_district(lat, lng)
    weather_state = get_current_weather()
    districts = weather_state.get("districts", {})

    district_record = districts.get(nearest["district"])
    if district_record:
        return district_record

    # Fallback single record
    return {
        "id": nearest["id"],
        "district": nearest["district"],
        "state": nearest["state"],
        "lat": nearest["lat"],
        "lng": nearest["lng"],
        "current_rain_mm": 0.0,
        "current_precipitation_mm": 0.0,
        "weather_code": 0,
        "weather_description": "Clear sky",
        "forecast_next_6h_mm": 0.0,
        "forecast_next_24h_mm": 0.0,
        "forecast_next_48h_mm": 0.0,
        "hourly_forecast": [],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "Default Baseline"
    }


def get_weather_summary() -> Dict[str, Any]:
    """
    Computes regional meteorological summary across all monitored NER corridors.
    """
    weather_state = get_current_weather()
    districts = weather_state.get("districts", {})

    if not districts:
        return {
            "status": "NO_DATA",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "active_districts_count": 0,
            "max_rainfall_district": None,
            "max_rainfall_current_mm": 0.0,
            "max_24h_forecast_district": None,
            "max_24h_forecast_mm": 0.0,
            "regional_average_current_rain_mm": 0.0,
            "districts_with_active_rain": 0
        }

    records = list(districts.values())
    max_curr = max(records, key=lambda r: r.get("current_rain_mm", 0.0))
    max_24h = max(records, key=lambda r: r.get("forecast_next_24h_mm", 0.0))
    active_rain_count = sum(1 for r in records if r.get("current_rain_mm", 0.0) > 0.0 or r.get("current_precipitation_mm", 0.0) > 0.0)
    avg_curr = round(sum(r.get("current_rain_mm", 0.0) for r in records) / len(records), 2)

    return {
        "status": weather_state.get("status", "OK"),
        "timestamp": weather_state.get("timestamp"),
        "source": weather_state.get("source", "Open-Meteo Live API"),
        "active_districts_count": len(records),
        "max_rainfall_district": {
            "district": max_curr["district"],
            "state": max_curr["state"],
            "current_rain_mm": max_curr["current_rain_mm"],
            "weather_description": max_curr["weather_description"]
        },
        "max_24h_forecast_district": {
            "district": max_24h["district"],
            "state": max_24h["state"],
            "forecast_next_24h_mm": max_24h["forecast_next_24h_mm"]
        },
        "regional_average_current_rain_mm": avg_curr,
        "districts_with_active_rain": active_rain_count
    }

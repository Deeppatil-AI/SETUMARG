"""
Setumarg: AI-based Smart Logistics and Accessibility Intelligence Platform (NER)
Seed Dataset for North Eastern Region (NER) of India.

Grounded in:
- NHAI / MoRTH National Highway Network in NER (NH-27, NH-37, NH-6/44, NH-10, NH-102, NH-13).
- Geological Survey of India (GSI) Bhukosh lineament and landslide inventory data.
- Census 2011 & PMGSY rural connectivity records for Arunachal Pradesh, Assam, Meghalaya, Sikkim, Nagaland, Manipur, Mizoram, Tripura.
- National Waterways Act, 2016 (National Waterway 2: Brahmaputra River 891 km).
"""

ROAD_SEGMENTS = [
    {
        "id": "SEG-NH44-01",
        "highway": "NH-6 / NH-44",
        "name": "Guwahati-Shillong Highland Section (Umiam Ghy Pass)",
        "state": "Meghalaya",
        "coordinates": [
            [26.1158, 91.8021],
            [25.9654, 91.8845],
            [25.7512, 91.9023],
            [25.5788, 91.8933]
        ],
        "length_km": 68.5,
        "elevation_m": 1490,
        "slope_deg": 32.4,
        "aspect_deg": 195.0,
        "plan_curvature": 1.85,
        "profile_curvature": -1.62,
        "dist_to_drainage_m": 120.0,
        "dist_to_fault_m": 420.0,
        "dist_to_road_m": 5.0,
        "ndvi": 0.58,
        "lulc_class": 4, # Road cut / human intervention
        "lithology_class": 3, # Shillong Plateau Crystalline Quartzite
        "soil_texture": 2, # Silty Clay
        "base_rainfall_mm": 55.0,
        "primary_hazard": "Rockfall and debris flow along steep cut slopes",
        "strategic_importance": "Critical trunk line connecting Shillong, Silchar, Tripura, and Mizoram to Guwahati."
    },
    {
        "id": "SEG-NH44-02",
        "highway": "NH-6 / NH-44",
        "name": "Jowai-Sonapur Tunnel-Ratacherra Landslide Corridor",
        "state": "Meghalaya",
        "coordinates": [
            [25.4412, 92.2045],
            [25.2654, 92.3512],
            [25.1098, 92.3987],
            [24.9876, 92.4876]
        ],
        "length_km": 74.0,
        "elevation_m": 880,
        "slope_deg": 41.2, # Very steep
        "aspect_deg": 210.0,
        "plan_curvature": 2.45,
        "profile_curvature": -2.10,
        "dist_to_drainage_m": 45.0,
        "dist_to_fault_m": 180.0, # Proximate to Dauki Thrust
        "dist_to_road_m": 2.0,
        "ndvi": 0.32, # Degraded / active slide zone
        "lulc_class": 3, # Jhum / loose regolith
        "lithology_class": 2, # Tertiary Shale / Sandstone (highly weathered)
        "soil_texture": 4, # Colluvial Debris
        "base_rainfall_mm": 95.0, # Cherrapunji-Mawsynram rain belt flank
        "primary_hazard": "Major mudslides; recurrent Sonapur mud tunnel blockages",
        "strategic_importance": "The sole economic lifeline to the entire Barak Valley (Silchar), Mizoram, and Tripura."
    },
    {
        "id": "SEG-NH37-01",
        "highway": "NH-715 / NH-37",
        "name": "Kaziranga-Brahmaputra Flood Plain Highway",
        "state": "Assam",
        "coordinates": [
            [26.6021, 92.9543],
            [26.5890, 93.1765],
            [26.6212, 93.4123],
            [26.6543, 93.6089]
        ],
        "length_km": 82.0,
        "elevation_m": 72,
        "slope_deg": 4.5,
        "aspect_deg": 45.0,
        "plan_curvature": 0.10,
        "profile_curvature": 0.05,
        "dist_to_drainage_m": 80.0,
        "dist_to_fault_m": 5400.0,
        "dist_to_road_m": 0.0,
        "ndvi": 0.74,
        "lulc_class": 1, # Protected forest / riverine
        "lithology_class": 1, # Quaternary Brahmaputra Alluvium
        "soil_texture": 1, # Sandy Loam
        "base_rainfall_mm": 40.0,
        "primary_hazard": "Seasonal inundation, wildlife crossing bottlenecks, riverbank erosion",
        "strategic_importance": "Connects Lower Assam to Upper Assam tea & oil hubs (Jorhat, Dibrugarh)."
    },
    {
        "id": "SEG-NH37-02",
        "highway": "NH-37 / NH-2",
        "name": "Numaligarh-Golaghat-Dimapur Gateway",
        "state": "Assam / Nagaland",
        "coordinates": [
            [26.6123, 93.7543],
            [26.5123, 93.9876],
            [26.0543, 93.9123],
            [25.9067, 93.7278]
        ],
        "length_km": 96.0,
        "elevation_m": 180,
        "slope_deg": 14.8,
        "aspect_deg": 140.0,
        "plan_curvature": 0.85,
        "profile_curvature": -0.70,
        "dist_to_drainage_m": 310.0,
        "dist_to_fault_m": 1200.0, # Naga Thrust margin
        "dist_to_road_m": 10.0,
        "ndvi": 0.65,
        "lulc_class": 2,
        "lithology_class": 2, # Barail & Disang Flysch
        "soil_texture": 2,
        "base_rainfall_mm": 48.0,
        "primary_hazard": "Road subsidence and slip failures along tea garden margins",
        "strategic_importance": "Primary logistics spine feeding Kohima and Manipur."
    },
    {
        "id": "SEG-NH29-01",
        "highway": "NH-29",
        "name": "Dimapur-Kohima Hill Pass (Phesama Slide Zone)",
        "state": "Nagaland",
        "coordinates": [
            [25.9067, 93.7278],
            [25.7890, 93.9212],
            [25.6743, 94.1089],
            [25.6421, 94.1154]
        ],
        "length_km": 72.0,
        "elevation_m": 1440,
        "slope_deg": 38.5,
        "aspect_deg": 240.0,
        "plan_curvature": 2.15,
        "profile_curvature": -1.95,
        "dist_to_drainage_m": 90.0,
        "dist_to_fault_m": 310.0, # Naga Thrust
        "dist_to_road_m": 4.0,
        "ndvi": 0.42,
        "lulc_class": 4, # Unplanned mountain cuts
        "lithology_class": 4, # Disang Shales (crumbles rapidly when saturated)
        "soil_texture": 4,
        "base_rainfall_mm": 68.0,
        "primary_hazard": "Catastrophic slope cleavage, Phesama creep, active boulder fall",
        "strategic_importance": "Vital supply link to Nagaland capital and forward military posts."
    },
    {
        "id": "SEG-NH102-01",
        "highway": "NH-102",
        "name": "Imphal-Tengnoupal-Moreh Asian Highway Corridor",
        "state": "Manipur",
        "coordinates": [
            [24.8170, 93.9368],
            [24.5210, 94.0123],
            [24.3210, 94.1567],
            [24.2456, 94.3056]
        ],
        "length_km": 110.0,
        "elevation_m": 1200,
        "slope_deg": 28.6,
        "aspect_deg": 180.0,
        "plan_curvature": 1.20,
        "profile_curvature": -1.15,
        "dist_to_drainage_m": 220.0,
        "dist_to_fault_m": 650.0,
        "dist_to_road_m": 8.0,
        "ndvi": 0.55,
        "lulc_class": 3,
        "lithology_class": 4, # Indo-Burma Ophiolite Belt
        "soil_texture": 3,
        "base_rainfall_mm": 52.0,
        "primary_hazard": "Monsoon mud accumulation, high-altitude hairpin washouts",
        "strategic_importance": "Key branch of India-Myanmar-Thailand Trilateral Highway (Act East policy)."
    },
    {
        "id": "SEG-NH13-01",
        "highway": "NH-13",
        "name": "Pasighat-Roing-Dibang Valley Feeder (Eastern Himalaya)",
        "state": "Arunachal Pradesh",
        "coordinates": [
            [28.0667, 95.3333],
            [28.1450, 95.8450],
            [28.2560, 95.9120],
            [28.5230, 95.8430]
        ],
        "length_km": 94.0,
        "elevation_m": 2150,
        "slope_deg": 44.1, # Extreme slope
        "aspect_deg": 170.0,
        "plan_curvature": 3.10,
        "profile_curvature": -2.85,
        "dist_to_drainage_m": 35.0, # Dibang river gorge
        "dist_to_fault_m": 110.0, # Main Central Thrust (MCT) shear zone
        "dist_to_road_m": 3.0,
        "ndvi": 0.38, # Barren scars / glacial till
        "lulc_class": 2,
        "lithology_class": 3, # Gneisses & Schists (fractured)
        "soil_texture": 4, # Coarse colluvium
        "base_rainfall_mm": 110.0, # Very high orographic precipitation
        "primary_hazard": "Massive rotational slips, Dibang flash-surges, debris avalanches",
        "strategic_importance": "Critical frontier highway for Indo-Tibetan border defense and remote tribal access."
    },
    {
        "id": "SEG-NH10-01",
        "highway": "NH-10",
        "name": "Sevoke-Teesta Bazaar-Rangpo Gangtok Corridor",
        "state": "Sikkim / West Bengal",
        "coordinates": [
            [26.8854, 88.4721],
            [27.0543, 88.4312],
            [27.1765, 88.5234],
            [27.3314, 88.6138]
        ],
        "length_km": 88.0,
        "elevation_m": 1650,
        "slope_deg": 43.8,
        "aspect_deg": 225.0,
        "plan_curvature": 2.90,
        "profile_curvature": -2.70,
        "dist_to_drainage_m": 25.0, # Teesta River adjacent
        "dist_to_fault_m": 95.0, # Main Boundary Thrust (MBT)
        "dist_to_road_m": 2.0,
        "ndvi": 0.35,
        "lulc_class": 4,
        "lithology_class": 3, # Daling Series Phyllites (extremely fragile)
        "soil_texture": 4,
        "base_rainfall_mm": 105.0,
        "primary_hazard": "Chronic 29th Mile / Swetijhora landslide breaches, Teesta flooding",
        "strategic_importance": "Sole civilian and military arterial road connecting Sikkim to the rest of India."
    },
    {
        "id": "SEG-NH27-01",
        "highway": "NH-27",
        "name": "Siliguri Chicken's Neck - Bongaigaon East-West Corridor",
        "state": "West Bengal / Assam",
        "coordinates": [
            [26.7271, 88.3953],
            [26.5412, 89.5123],
            [26.4789, 90.1234],
            [26.4812, 90.5643]
        ],
        "length_km": 215.0,
        "elevation_m": 85,
        "slope_deg": 3.2,
        "aspect_deg": 90.0,
        "plan_curvature": 0.05,
        "profile_curvature": 0.02,
        "dist_to_drainage_m": 450.0,
        "dist_to_fault_m": 9200.0,
        "dist_to_road_m": 0.0,
        "ndvi": 0.68,
        "lulc_class": 4,
        "lithology_class": 1,
        "soil_texture": 1,
        "base_rainfall_mm": 35.0,
        "primary_hazard": "Bridge approaches wash-away during intense flood surges; heavy freight bottlenecks",
        "strategic_importance": "The vital 22 km wide 'Chicken's Neck' connecting 8 NE states to mainland India."
    },
    {
        "id": "SEG-NH27-02",
        "highway": "NH-27",
        "name": "Bongaigaon-Guwahati Four-Lane Highway",
        "state": "Assam",
        "coordinates": [
            [26.4812, 90.5643],
            [26.4123, 91.0543],
            [26.2890, 91.4567],
            [26.1445, 91.7362]
        ],
        "length_km": 155.0,
        "elevation_m": 55,
        "slope_deg": 2.1,
        "aspect_deg": 110.0,
        "plan_curvature": 0.02,
        "profile_curvature": 0.01,
        "dist_to_drainage_m": 600.0,
        "dist_to_fault_m": 12000.0,
        "dist_to_road_m": 0.0,
        "ndvi": 0.62,
        "lulc_class": 4,
        "lithology_class": 1,
        "soil_texture": 1,
        "base_rainfall_mm": 30.0,
        "primary_hazard": "Waterlogging on service lanes; highly stable all-weather expressway",
        "strategic_importance": "Core artery for Guwahati logistics distribution hub."
    },
    {
        "id": "SEG-NH54-01",
        "highway": "NH-306 / NH-54",
        "name": "Silchar-Kolasib-Aizawl Hill Highway",
        "state": "Assam / Mizoram",
        "coordinates": [
            [24.8333, 92.7789],
            [24.5123, 92.7123],
            [24.2250, 92.6845],
            [23.7271, 92.7176]
        ],
        "length_km": 178.0,
        "elevation_m": 1130,
        "slope_deg": 35.7,
        "aspect_deg": 160.0,
        "plan_curvature": 1.75,
        "profile_curvature": -1.80,
        "dist_to_drainage_m": 110.0,
        "dist_to_fault_m": 480.0,
        "dist_to_road_m": 5.0,
        "ndvi": 0.48,
        "lulc_class": 3, # Jhum cultivation on ridges
        "lithology_class": 2, # Surma Group siltstones
        "soil_texture": 3,
        "base_rainfall_mm": 72.0,
        "primary_hazard": "Progressive toe-erosion by mountain torrents, mud deposits",
        "strategic_importance": "Sole highway supplying fuel, medicine, and food grains to Mizoram."
    },
    {
        "id": "SEG-NH8-01",
        "highway": "NH-8",
        "name": "Karimganj-Dharmanagar-Agartala Highway",
        "state": "Assam / Tripura",
        "coordinates": [
            [24.8645, 92.3512],
            [24.3812, 92.1645],
            [24.0543, 91.7512],
            [23.8315, 91.2868]
        ],
        "length_km": 192.0,
        "elevation_m": 140,
        "slope_deg": 12.3,
        "aspect_deg": 105.0,
        "plan_curvature": 0.45,
        "profile_curvature": -0.35,
        "dist_to_drainage_m": 290.0,
        "dist_to_fault_m": 2200.0,
        "dist_to_road_m": 6.0,
        "ndvi": 0.69,
        "lulc_class": 2,
        "lithology_class": 2, # Tipam Sandstones
        "soil_texture": 2,
        "base_rainfall_mm": 50.0,
        "primary_hazard": "Heavy monsoon washouts along Low Hills; bridge scour",
        "strategic_importance": "Primary logistics corridor for Tripura."
    }
]

# 25 Representative Villages across all 8 NER states
VILLAGES = [
    # Meghalaya
    {
        "id": "VIL-MEG-01",
        "name": "Khatarshnong",
        "state": "Meghalaya",
        "district": "East Khasi Hills",
        "lat": 25.2912,
        "lng": 91.7450,
        "population": 1420,
        "elevation_m": 1260,
        "nearest_facility": "Cherrapunji CHC",
        "travel_time_hospital_min": 78,
        "travel_time_highway_min": 52,
        "travel_time_town_min": 85,
        "all_weather_road_access": False,
        "primary_feeder_segment": "SEG-NH44-01",
        "connectivity_type": "2G Low Connectivity",
        "sarpanch_contact": "+91-94361-XXXXX"
    },
    {
        "id": "VIL-MEG-02",
        "name": "Sonapur Basti",
        "state": "Meghalaya",
        "district": "East Jaintia Hills",
        "lat": 25.1120,
        "lng": 92.3870,
        "population": 2180,
        "elevation_m": 640,
        "nearest_facility": "Khliehriat Civil Hospital",
        "travel_time_hospital_min": 92,
        "travel_time_highway_min": 12,
        "travel_time_town_min": 65,
        "all_weather_road_access": False,
        "primary_feeder_segment": "SEG-NH44-02",
        "connectivity_type": "Intermittent 4G",
        "sarpanch_contact": "+91-94362-XXXXX"
    },
    {
        "id": "VIL-MEG-03",
        "name": "Nongstoin Rural",
        "state": "Meghalaya",
        "district": "West Khasi Hills",
        "lat": 25.5210,
        "lng": 91.2710,
        "population": 3650,
        "elevation_m": 1410,
        "nearest_facility": "Nongstoin District Hospital",
        "travel_time_hospital_min": 35,
        "travel_time_highway_min": 75,
        "travel_time_town_min": 40,
        "all_weather_road_access": True,
        "primary_feeder_segment": "SEG-NH44-01",
        "connectivity_type": "3G/4G",
        "sarpanch_contact": "+91-94363-XXXXX"
    },
    {
        "id": "VIL-MEG-04",
        "name": "Mawlynnong",
        "state": "Meghalaya",
        "district": "East Khasi Hills",
        "lat": 25.2016,
        "lng": 91.9167,
        "population": 950,
        "elevation_m": 490,
        "nearest_facility": "Pynursla CHC",
        "travel_time_hospital_min": 42,
        "travel_time_highway_min": 35,
        "travel_time_town_min": 60,
        "all_weather_road_access": True,
        "primary_feeder_segment": "SEG-NH44-01",
        "connectivity_type": "4G",
        "sarpanch_contact": "+91-94364-XXXXX"
    },
    {
        "id": "VIL-MEG-05",
        "name": "Umkiang Border Hamlet",
        "state": "Meghalaya",
        "district": "East Jaintia Hills",
        "lat": 25.0450,
        "lng": 92.4210,
        "population": 1840,
        "elevation_m": 310,
        "nearest_facility": "Kalain PHC (Assam border)",
        "travel_time_hospital_min": 110,
        "travel_time_highway_min": 25,
        "travel_time_town_min": 80,
        "all_weather_road_access": False,
        "primary_feeder_segment": "SEG-NH44-02",
        "connectivity_type": "2G Only",
        "sarpanch_contact": "+91-94365-XXXXX"
    },

    # Arunachal Pradesh
    {
        "id": "VIL-ARU-01",
        "name": "Anini Outskirts",
        "state": "Arunachal Pradesh",
        "district": "Dibang Valley",
        "lat": 28.7900,
        "lng": 95.9020,
        "population": 2260,
        "elevation_m": 1968,
        "nearest_facility": "Anini District Hospital",
        "travel_time_hospital_min": 25,
        "travel_time_highway_min": 165,
        "travel_time_town_min": 30,
        "all_weather_road_access": False,
        "primary_feeder_segment": "SEG-NH13-01",
        "connectivity_type": "Satellite/2G",
        "sarpanch_contact": "+91-94366-XXXXX"
    },
    {
        "id": "VIL-ARU-02",
        "name": "Etalin Gorge",
        "state": "Arunachal Pradesh",
        "district": "Dibang Valley",
        "lat": 28.6120,
        "lng": 95.8710,
        "population": 840,
        "elevation_m": 920,
        "nearest_facility": "Roing CHC",
        "travel_time_hospital_min": 170,
        "travel_time_highway_min": 45,
        "travel_time_town_min": 160,
        "all_weather_road_access": False,
        "primary_feeder_segment": "SEG-NH13-01",
        "connectivity_type": "Zero Cellular (IVR/SMS gateway required)",
        "sarpanch_contact": "+91-94367-XXXXX"
    },
    {
        "id": "VIL-ARU-03",
        "name": "Hunli Alpine Settlement",
        "state": "Arunachal Pradesh",
        "district": "Lower Dibang Valley",
        "lat": 28.3240,
        "lng": 95.9620,
        "population": 1120,
        "elevation_m": 1380,
        "nearest_facility": "Roing District Hospital",
        "travel_time_hospital_min": 95,
        "travel_time_highway_min": 15,
        "travel_time_town_min": 95,
        "all_weather_road_access": False,
        "primary_feeder_segment": "SEG-NH13-01",
        "connectivity_type": "2G",
        "sarpanch_contact": "+91-94368-XXXXX"
    },
    {
        "id": "VIL-ARU-04",
        "name": "Mebo Riverine Village",
        "state": "Arunachal Pradesh",
        "district": "East Siang",
        "lat": 28.0210,
        "lng": 95.4210,
        "population": 2980,
        "elevation_m": 155,
        "nearest_facility": "Pasighat General Hospital",
        "travel_time_hospital_min": 45,
        "travel_time_highway_min": 20,
        "travel_time_town_min": 45,
        "all_weather_road_access": True,
        "primary_feeder_segment": "SEG-NH13-01",
        "connectivity_type": "4G",
        "sarpanch_contact": "+91-94369-XXXXX"
    },

    # Sikkim
    {
        "id": "VIL-SIK-01",
        "name": "Lachen High Valley",
        "state": "Sikkim",
        "district": "Mangan",
        "lat": 27.7167,
        "lng": 88.5500,
        "population": 1320,
        "elevation_m": 2750,
        "nearest_facility": "Chungthang PHC",
        "travel_time_hospital_min": 85,
        "travel_time_highway_min": 140,
        "travel_time_town_min": 90,
        "all_weather_road_access": False,
        "primary_feeder_segment": "SEG-NH10-01",
        "connectivity_type": "2G",
        "sarpanch_contact": "+91-94370-XXXXX"
    },
    {
        "id": "VIL-SIK-02",
        "name": "Dikchu River Edge",
        "state": "Sikkim",
        "district": "Gangtok",
        "lat": 27.3890,
        "lng": 88.5412,
        "population": 2450,
        "elevation_m": 690,
        "nearest_facility": "STNM Multi-speciality Hospital Gangtok",
        "travel_time_hospital_min": 50,
        "travel_time_highway_min": 22,
        "travel_time_town_min": 50,
        "all_weather_road_access": True,
        "primary_feeder_segment": "SEG-NH10-01",
        "connectivity_type": "4G",
        "sarpanch_contact": "+91-94371-XXXXX"
    },
    {
        "id": "VIL-SIK-03",
        "name": "Melli Teesta Junction",
        "state": "Sikkim",
        "district": "Namchi",
        "lat": 27.0912,
        "lng": 88.4560,
        "population": 3890,
        "elevation_m": 280,
        "nearest_facility": "Kalimpong Subdiv Hospital",
        "travel_time_hospital_min": 35,
        "travel_time_highway_min": 5,
        "travel_time_town_min": 35,
        "all_weather_road_access": True,
        "primary_feeder_segment": "SEG-NH10-01",
        "connectivity_type": "4G",
        "sarpanch_contact": "+91-94372-XXXXX"
    },

    # Nagaland
    {
        "id": "VIL-NAG-01",
        "name": "Phesama Slide Hamlet",
        "state": "Nagaland",
        "district": "Kohima",
        "lat": 25.6120,
        "lng": 94.1020,
        "population": 2840,
        "elevation_m": 1510,
        "nearest_facility": "Naga Hospital Authority Kohima",
        "travel_time_hospital_min": 40,
        "travel_time_highway_min": 8,
        "travel_time_town_min": 35,
        "all_weather_road_access": False,
        "primary_feeder_segment": "SEG-NH29-01",
        "connectivity_type": "4G",
        "sarpanch_contact": "+91-94373-XXXXX"
    },
    {
        "id": "VIL-NAG-02",
        "name": "Dzuleke Eco Village",
        "state": "Nagaland",
        "district": "Kohima",
        "lat": 25.6210,
        "lng": 93.9450,
        "population": 780,
        "elevation_m": 1680,
        "nearest_facility": "Khonoma PHC",
        "travel_time_hospital_min": 65,
        "travel_time_highway_min": 85,
        "travel_time_town_min": 90,
        "all_weather_road_access": False,
        "primary_feeder_segment": "SEG-NH29-01",
        "connectivity_type": "2G Only",
        "sarpanch_contact": "+91-94374-XXXXX"
    },
    {
        "id": "VIL-NAG-03",
        "name": "Medziphema Rural",
        "state": "Nagaland",
        "district": "Chümoukedima",
        "lat": 25.7560,
        "lng": 93.8540,
        "population": 5120,
        "elevation_m": 340,
        "nearest_facility": "Dimapur District Hospital",
        "travel_time_hospital_min": 32,
        "travel_time_highway_min": 10,
        "travel_time_town_min": 30,
        "all_weather_road_access": True,
        "primary_feeder_segment": "SEG-NH37-02",
        "connectivity_type": "4G",
        "sarpanch_contact": "+91-94375-XXXXX"
    },

    # Manipur
    {
        "id": "VIL-MAN-01",
        "name": "Tengnoupal Peak",
        "state": "Manipur",
        "district": "Tengnoupal",
        "lat": 24.3890,
        "lng": 94.1450,
        "population": 1950,
        "elevation_m": 1450,
        "nearest_facility": "Chandel District Hospital",
        "travel_time_hospital_min": 58,
        "travel_time_highway_min": 6,
        "travel_time_town_min": 60,
        "all_weather_road_access": False,
        "primary_feeder_segment": "SEG-NH102-01",
        "connectivity_type": "3G",
        "sarpanch_contact": "+91-94376-XXXXX"
    },
    {
        "id": "VIL-MAN-02",
        "name": "Khongkhang Border Village",
        "state": "Manipur",
        "district": "Tengnoupal",
        "lat": 24.3120,
        "lng": 94.2210,
        "population": 1180,
        "elevation_m": 880,
        "nearest_facility": "Moreh Sub-div Hospital",
        "travel_time_hospital_min": 45,
        "travel_time_highway_min": 12,
        "travel_time_town_min": 45,
        "all_weather_road_access": False,
        "primary_feeder_segment": "SEG-NH102-01",
        "connectivity_type": "2G",
        "sarpanch_contact": "+91-94377-XXXXX"
    },

    # Mizoram
    {
        "id": "VIL-MIZ-01",
        "name": "Bairabi Railhead Border",
        "state": "Mizoram",
        "district": "Kolasib",
        "lat": 24.1890,
        "lng": 92.5340,
        "population": 4300,
        "elevation_m": 120,
        "nearest_facility": "Kolasib District Hospital",
        "travel_time_hospital_min": 62,
        "travel_time_highway_min": 18,
        "travel_time_town_min": 60,
        "all_weather_road_access": True,
        "primary_feeder_segment": "SEG-NH54-01",
        "connectivity_type": "4G",
        "sarpanch_contact": "+91-94378-XXXXX"
    },
    {
        "id": "VIL-MIZ-02",
        "name": "Kawnpui Hill Ridge",
        "state": "Mizoram",
        "district": "Kolasib",
        "lat": 23.9540,
        "lng": 92.6840,
        "population": 3120,
        "elevation_m": 940,
        "nearest_facility": "Kolasib District Hospital",
        "travel_time_hospital_min": 42,
        "travel_time_highway_min": 10,
        "travel_time_town_min": 40,
        "all_weather_road_access": False,
        "primary_feeder_segment": "SEG-NH54-01",
        "connectivity_type": "3G/4G",
        "sarpanch_contact": "+91-94379-XXXXX"
    },

    # Assam
    {
        "id": "VIL-ASM-01",
        "name": "Badarpurghat Outskirts",
        "state": "Assam",
        "district": "Karimganj",
        "lat": 24.8950,
        "lng": 92.5710,
        "population": 5890,
        "elevation_m": 28,
        "nearest_facility": "Silchar Medical College & Hospital (SMCH)",
        "travel_time_hospital_min": 55,
        "travel_time_highway_min": 8,
        "travel_time_town_min": 25,
        "all_weather_road_access": True,
        "primary_feeder_segment": "SEG-NH44-02",
        "connectivity_type": "4G",
        "sarpanch_contact": "+91-94380-XXXXX"
    },
    {
        "id": "VIL-ASM-02",
        "name": "Kohora Buffer Village",
        "state": "Assam",
        "district": "Golaghat",
        "lat": 26.5890,
        "lng": 93.4120,
        "population": 3410,
        "elevation_m": 76,
        "nearest_facility": "Bokakhat Civil Hospital",
        "travel_time_hospital_min": 28,
        "travel_time_highway_min": 5,
        "travel_time_town_min": 25,
        "all_weather_road_access": True,
        "primary_feeder_segment": "SEG-NH37-01",
        "connectivity_type": "4G",
        "sarpanch_contact": "+91-94381-XXXXX"
    },
    {
        "id": "VIL-ASM-03",
        "name": "Kamalabari River Island",
        "state": "Assam",
        "district": "Majuli",
        "lat": 26.9540,
        "lng": 94.1890,
        "population": 4820,
        "elevation_m": 68,
        "nearest_facility": "Garmur Civil Hospital Majuli",
        "travel_time_hospital_min": 35,
        "travel_time_highway_min": 95,
        "travel_time_town_min": 40,
        "all_weather_road_access": False,
        "primary_feeder_segment": "SEG-NH37-01",
        "connectivity_type": "4G",
        "sarpanch_contact": "+91-94382-XXXXX"
    },
    {
        "id": "VIL-ASM-04",
        "name": "Jogighopa Inland Port Village",
        "state": "Assam",
        "district": "Bongaigaon",
        "lat": 26.2250,
        "lng": 90.5840,
        "population": 6200,
        "elevation_m": 42,
        "nearest_facility": "Goalpara Civil Hospital",
        "travel_time_hospital_min": 24,
        "travel_time_highway_min": 6,
        "travel_time_town_min": 20,
        "all_weather_road_access": True,
        "primary_feeder_segment": "SEG-NH27-02",
        "connectivity_type": "5G/4G",
        "sarpanch_contact": "+91-94383-XXXXX"
    },

    # Tripura
    {
        "id": "VIL-TRI-01",
        "name": "Churaibari Border Post",
        "state": "Tripura",
        "district": "North Tripura",
        "lat": 24.4890,
        "lng": 92.2450,
        "population": 3780,
        "elevation_m": 85,
        "nearest_facility": "Dharmanagar District Hospital",
        "travel_time_hospital_min": 38,
        "travel_time_highway_min": 4,
        "travel_time_town_min": 35,
        "all_weather_road_access": True,
        "primary_feeder_segment": "SEG-NH8-01",
        "connectivity_type": "4G",
        "sarpanch_contact": "+91-94384-XXXXX"
    },
    {
        "id": "VIL-TRI-02",
        "name": "Ambassa Hill Settlement",
        "state": "Tripura",
        "district": "Dhalai",
        "lat": 23.9210,
        "lng": 91.8540,
        "population": 4650,
        "elevation_m": 115,
        "nearest_facility": "Kulil Dhalai District Hospital",
        "travel_time_hospital_min": 20,
        "travel_time_highway_min": 8,
        "travel_time_town_min": 15,
        "all_weather_road_access": True,
        "primary_feeder_segment": "SEG-NH8-01",
        "connectivity_type": "4G",
        "sarpanch_contact": "+91-94385-XXXXX"
    }
]

FREIGHT_HUBS = [
    {
        "id": "HUB-GHY-01",
        "name": "Guwahati Logistics Cluster (Jogighopa MMLP & Pandu Port)",
        "lat": 26.1789,
        "lng": 91.6890,
        "modes": ["Road", "Rail", "Inland Waterway (NW-2)"],
        "railhead": "New Guwahati (NGC) Goods Yard",
        "river_port": "Pandu Port (Inland Waterways Authority of India)",
        "storage_capacity_tons": 85000,
        "cold_chain_capacity_tons": 12000
    },
    {
        "id": "HUB-SIL-01",
        "name": "Siliguri Gateway Freight Terminal",
        "lat": 26.7271,
        "lng": 88.3953,
        "modes": ["Road", "Rail"],
        "railhead": "New Jalpaiguri (NJP) Freight Terminal",
        "river_port": None,
        "storage_capacity_tons": 140000,
        "cold_chain_capacity_tons": 25000
    },
    {
        "id": "HUB-DHU-01",
        "name": "Dhubri River Port (Indo-Bangladesh Protocol Route)",
        "lat": 26.0210,
        "lng": 89.9750,
        "modes": ["Road", "Inland Waterway (NW-2)"],
        "railhead": "Fakiragram Junction",
        "river_port": "Dhubri IWAI Terminal",
        "storage_capacity_tons": 35000,
        "cold_chain_capacity_tons": 4000
    },
    {
        "id": "HUB-SCL-01",
        "name": "Silchar Logistics Hub (Barak Valley Gateway)",
        "lat": 24.8333,
        "lng": 92.7789,
        "modes": ["Road", "Rail"],
        "railhead": "Badarpur / Silchar Goods Shed",
        "river_port": None,
        "storage_capacity_tons": 45000,
        "cold_chain_capacity_tons": 6000
    },
    {
        "id": "HUB-DBR-01",
        "name": "Dibrugarh / Neamati Port Logistics Complex",
        "lat": 27.4728,
        "lng": 94.9120,
        "modes": ["Road", "Rail", "Inland Waterway (NW-2)"],
        "railhead": "Dibrugarh Banipur Yard",
        "river_port": "Neamati Ghat / Bogibeel Terminal",
        "storage_capacity_tons": 50000,
        "cold_chain_capacity_tons": 8000
    },
    {
        "id": "HUB-DMV-01",
        "name": "Dimapur Transshipment Depot",
        "lat": 25.9067,
        "lng": 93.7278,
        "modes": ["Road", "Rail"],
        "railhead": "Dimapur Goods Yard",
        "river_port": None,
        "storage_capacity_tons": 38000,
        "cold_chain_capacity_tons": 3500
    }
]

RAINFALL_SCENARIOS = {
    "dry_clear": {
        "name": "Normal / Dry Winter Conditions",
        "description": "Precipitation 0-5 mm/day. Baseline static geological stability.",
        "rainfall_multiplier": 0.2,
        "average_mm_hr": 1.2
    },
    "monsoon_moderate": {
        "name": "Active South-West Monsoon Surge",
        "description": "Continuous persistent rainfall 25-45 mm/day across Meghalaya & Sub-Himalayan Bengal.",
        "rainfall_multiplier": 1.0,
        "average_mm_hr": 18.5
    },
    "monsoon_heavy": {
        "name": "Severe Monsoon Depression (IMD Red Alert)",
        "description": "Heavy to very heavy rainfall 70-120 mm/day. Saturated regolith in Jowai-Sonapur & Teesta.",
        "rainfall_multiplier": 2.1,
        "average_mm_hr": 48.0
    },
    "cloudburst_extreme": {
        "name": "Catastrophic Cloudburst / Flash Torrent Event",
        "description": "Local precipitation exceeding 100 mm in 2 hours over Eastern Himalaya (Dibang Valley, NH-10).",
        "rainfall_multiplier": 3.4,
        "average_mm_hr": 96.0
    }
}

# Automatically load high-resolution OSM road geometries and snapped villages if available
import os
import json

_REAL_DATA_PATH = os.path.join(os.path.dirname(__file__), "real_network_data.json")
if os.path.exists(_REAL_DATA_PATH):
    try:
        with open(_REAL_DATA_PATH, "r", encoding="utf-8") as _f:
            _payload = json.load(_f)
            if "road_segments" in _payload and len(_payload["road_segments"]) > 0:
                ROAD_SEGMENTS = _payload["road_segments"]
            if "villages" in _payload and len(_payload["villages"]) > 0:
                VILLAGES = _payload["villages"]
    except Exception as _e:
        print(f"Notice: using baseline seed data due to: {_e}")

# Setumarg: Data Sources & Integration Architecture

> **Smart India Hackathon 2026** | Problem Statement ID: **SIH26002** (Theme: Transportation & Logistics)  
> **Platform**: Setumarg — AI-based Smart Logistics and Accessibility Intelligence for the North Eastern Region (NER)

This document details the data engineering pipelines, geomorphic conditioning factors, and national GIS layers integrated into the Setumarg platform.

---

## 1. Prototype Live & Derived Feeds vs. Production Target Systems

In Setumarg, the platform operates on a hybrid architecture combining **live public meteorological feeds**, **satellite digital elevation models**, and **real OpenStreetMap geometries** with literature-calibrated geotechnical and multi-modal logistics layers across **415 monitored highway sub-segments** (~2,100 km across 7 corridors), **25 representative villages** across all 8 NER states, and **6 strategic multi-modal freight hubs**.

The table below provides the status of each data domain and its corresponding national/satellite production feed mapping:

| Data Domain | Current Platform State | Implementation / Source Used | Production Integration Target | Refresh Cadence |
| :--- | :--- | :--- | :--- | :--- |
| **Live Precipitation & Meteorology** | **Live Public API Ingestion** | **Open-Meteo API** (Current precipitation rate, WMO codes, and 48-hour hourly rain forecasts across 33 NER district centroids) with interactive simulation scrubber override | **IMD Doppler Weather Radar** (Cherrapunji, Mohanbari, Agartala) + **NASA GPM IMERG** | Real-time (15-minute background auto-recompute) |
| **Terrain Slope & Aspect** | **Real Satellite Data** | **NASA SRTM 30m** (5-point cross stencil via OpenTopoData API, cached locally in `elevation_cache.json` across 411 unique midpoints) | **ISRO Bhuvan** 10m/30m CartoDEM | Static terrain model (High resolution) |
| **Historical Hotspot Failure Outlook** | **Calibrated Empirical Model** | Logged repeat blockage history (Sonapur: 18, Teesta: 24, Phesama: 12, Tengnoupal: 9, Roing: 14) evaluated against critical 24-48h rainfall triggers (42–52 mm) via logistic failure curves | **NDMA National Landslide Risk Management Strategy** & **GSI Landslide Incident Repository** | Dynamic (Per weather fetch) |
| **Road Network & Geometries** | **Real Data** | **OpenStreetMap (OSRM)** Overpass API: 415 contiguous sub-segments across 7 major NER corridors | **MoRTH / NHAI GIS Portal** + **PM GatiShakti NMP** | Real-time road geometry & topology |
| **Landslide Conditioning Factors** | **Literature-Calibrated / Seeded** | 12 geotechnical features (curvature, faults, drainage, NDVI, lithology, soil) calibrated to published Eastern Himalaya research (Dibang Valley RF study) | **GSI Bhukosh** (1:50,000 National Landslide Susceptibility Mapping) | 30-meter spatial resolution |
| **Active Faults & Lineaments** | **Seeded Buffer Zones** | Main Central Thrust (MCT), Main Boundary Thrust (MBT), and Dauki Fault proximity buffers | **GSI Seismo-Tectonic Atlas of India** & Lineament GIS Layer | Vector lineaments layer |
| **Rural Settlements & Health Access** | **Real Snapped Coordinates / Seeded Population** | 25 villages with population and road travel times to nearest CHC/PHC snapped to road network | **PMGSY Rural Roads Geoportal** + **Census 2011 Village Directory** + **WorldPop** | Population-weighted village centroids |
| **Multi-Modal Waterway Transit** | **Real River Geometry / Seeded Tariffs** | NW-2 Brahmaputra River route (Dhubri, Pandu, Silghat, Neamati, Bogibeel) | **IWAI (Inland Waterways Authority of India)** National Waterway 2 Terminal APIs | Daily terminal draft & barge tracking |
| **Unified Logistics Interoperability** | **Operational Schema** | Exportable JSON contract schema conforming to ULIP v2.4 specification | **ULIP (Unified Logistics Interface Platform)** & **PM GatiShakti NMP** (1,600+ GIS layers) | RESTful API webhook / Kafka event stream |
| **Ground Incident Verification** | **Real-Time Interactive** | Crowdsourced pin-drop reporting with photo upload support, severity, and GPS timestamp | **NASA LHASA Landslide Reporter** + **BRO Project Shivalik/Pushpak SITREPs** | Sub-minute event logging |

---

## 2. Landslide Conditioning Factor Specifications

Modeled on peer-reviewed susceptibility assessments in the **Eastern Himalaya** (Dibang Valley, Arunachal Pradesh; NE India–Bhutan Corridor):

1. **Slope Inclination (`slope_deg`)**: Primary gravitational shear driver. Slopes $>35^\circ$ in phyllite/schist terranes exhibit high susceptibility.
2. **Slope Aspect (`aspect_deg`)**: Solar insolation, moisture retention, and monsoon windward exposure. South and South-West facing slopes receive heavy orographic monsoon rain.
3. **Planform Curvature (`plan_curvature`)**: Flow divergence/convergence of subsurface pore water.
4. **Profile Curvature (`profile_curvature`)**: Acceleration/deceleration of downslope debris mass.
5. **Distance to Drainage (`dist_to_drainage_m`)**: Toe-erosion by mountain torrents (e.g. Teesta, Dibang, Barak river margins).
6. **Distance to Major Faults (`dist_to_fault_m`)**: Proximity to Main Boundary Thrust (MBT), Main Central Thrust (MCT), and Dauki Fault. Fault zones feature shattered, heavily weathered rock mass with low cohesion.
7. **Distance to Road Toe (`dist_to_road_m`)**: Over-steepened hill cuts for highway expansion remove toe support.
8. **Normalized Difference Vegetation Index (`ndvi`)**: Root cohesion and canopy interception. Low NDVI ($<0.35$) marks active slide scars or barren slopes.
9. **Land-Use / Land-Cover (`lulc_class`)**: Forest, Degraded, Jhum (shifting slash-and-burn agriculture with loose topsoil), Built-up.
10. **Lithology Class (`lithology_class`)**: Rock competency: Alluvium, Tertiary Sandstone/Shale (Surma/Disang), Crystalline Gneiss, and Fragile Phyllite/Ophiolitic Melange.
11. **Soil Texture (`soil_texture`)**: Infiltration vs. water logging: Sandy Loam, Silty Clay, Gravelly Loam, Coarse Colluvial Debris.
12. **Antecedent Rainfall (`base_rainfall_mm`)**: 24-hour antecedent rainfall index ($API$) establishing initial soil saturation.

---

## 3. NASA LHASA Nowcasting Fusion Algorithm

Setumarg adopts the **NASA LHASA** (Landslide Hazard Assessment for Situational Awareness) model structure:

$$R_{\text{dynamic}} = \min\left(1.0, \; S_{\text{static}} \times \left(0.6 + 0.4 \times \frac{R_{\text{current}}}{R_{\text{baseline}}}\right)\right)$$

Where:
- $S_{\text{static}} \in [0.0, 1.0]$: Susceptibility score generated by the trained **Random Forest Classifier** (100 estimators, trained on 12 Himalayan factors).
- $R_{\text{current}} / R_{\text{baseline}}$: Precipitation intensity multiplier. In **Live Operation (Default Mode)**, this multiplier is computed dynamically from real-time Open-Meteo observations and 24-hour rainfall forecasts across district centroids ($M_{\text{live}} = 0.5 + 2.0 \cdot \min(1.0, P_{24h} / 60.0)$). In **Simulation Mode**, this is driven by the manual UI scrubber ($0.2\times$ in dry conditions to $3.5\times$ during simulated cloudbursts).
- Any confirmed crowdsourced blockage instantly elevates $R_{\text{dynamic}} \ge 0.96$ (Severe / Impassable).

---

## 4. Empirical Hotspot Failure & Disruption Outlook

For notoriously vulnerable choke points with repeated historical blockages (e.g., Sonapur Tunnel on NH-6, Teesta Corridor on NH-10, Phesama on NH-29, Tengnoupal on NH-102, Roing on NH-13), Setumarg incorporates an empirical logistic failure prediction model:

$$P_{\text{disruption}} = \frac{1}{1 + e^{-k \cdot (P_{24-48h} - T_{\text{crit}})}}$$

Where:
- $T_{\text{crit}}$: Empirical critical 24-hour precipitation threshold ($42.0\text{ mm}$ to $52.0\text{ mm}$) derived from historical landslide disaster logs.
- $P_{24-48h}$: Live forecasted 24h to 48h cumulative rainfall from Open-Meteo.
- $k$: Logistic sensitivity slope ($0.08$ to $0.11$).
- When $P_{\text{disruption}} \ge 60\%$, the route optimizer issues proactive diversion warnings before physical blockages strand vehicles.


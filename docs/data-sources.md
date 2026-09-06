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
| **Live Precipitation & Meteorology** | **Live Public API Ingestion** | **Open-Meteo API** (Current precipitation rate, WMO codes, and 48-hour hourly rain forecasts across 33 NER district centroids) with spatial rain badges on the map and interactive simulation scrubber override | **IMD Doppler Weather Radar** (Cherrapunji, Mohanbari, Agartala) + **NASA GPM IMERG** | Real-time (15-minute background auto-recompute) |
| **Terrain Slope & Aspect** | **Real Satellite Data** | **NASA SRTM 30m** (5-point cross stencil via OpenTopoData API, cached locally in `elevation_cache.json` across 411 unique midpoints) | **ISRO Bhuvan** 10m/30m CartoDEM | Static terrain model (High resolution) |
| **Pedological Soil Geotechnical Matrix** | **Real Geodatabase** | **ISRIC SoilGrids 250m & ICAR-NBSS&LUP 1:250,000 NER Soil Survey** (Soil texture class, clay %, sand %, silt %, regolith depth cm, bulk density, cohesion $c'$, internal friction angle $\phi'$, cached in `soil_cache.json` across 411 coordinate centroids) | **National Bureau of Soil Survey & Land Use Planning (NBSS&LUP)** GIS | 250-meter gridded soil physics |
| **Historical Landslide Inventory Layer** | **Real Government Geodatabase** | **Geological Survey of India (GSI) Bhukosh & NLSM Portal**: 56 verified historical landslide field events (1998–2024) across the 7 highway corridors with trigger rainfall, slide type, closure days, and volume ($m^3$) in `gsi_historical_landslides.json` | **GSI Bhukosh Web Portal** & **NDMA National Disaster Management Geoportal** | Continuous historical registry |
| **Historical Hotspot Failure Outlook** | **Calibrated Empirical Model** | Logged repeat blockage history (Sonapur: 18, Teesta: 24, Phesama: 12, Tengnoupal: 9, Roing: 14) calibrated to nearby GSI Bhukosh points, evaluated against critical 24-48h rainfall triggers (42–52 mm) via logistic failure curves | **NDMA National Landslide Risk Management Strategy** & **GSI Landslide Incident Repository** | Dynamic (Per weather fetch) |
| **Road Network & Geometries** | **Real Data** | **OpenStreetMap (OSRM)** Overpass API: 415 contiguous sub-segments across 7 major NER corridors | **MoRTH / NHAI GIS Portal** + **PM GatiShakti NMP** | Real-time road geometry & topology |
| **Landslide Conditioning Factors** | **Literature-Calibrated / Seeded** | 12 geotechnical features (curvature, faults, drainage, NDVI, lithology, soil) calibrated to published Eastern Himalaya research (Dibang Valley RF study) | **GSI Bhukosh** (1:50,000 National Landslide Susceptibility Mapping) | 30-meter spatial resolution |
| **Active Faults & Lineaments** | **Seeded Buffer Zones** | Main Central Thrust (MCT), Main Boundary Thrust (MBT), and Dauki Fault proximity buffers | **GSI Seismo-Tectonic Atlas of India** & Lineament GIS Layer | Vector lineaments layer |
| **Rural Settlements & Health Access** | **Real Snapped Coordinates / Seeded Population** | 25 villages with population and road travel times to nearest CHC/PHC snapped to road network | **PMGSY Rural Roads Geoportal** + **Census 2011 Village Directory** + **WorldPop** | Population-weighted village centroids |
| **Multi-Modal Waterway Transit** | **Real River Geometry / Seeded Tariffs** | NW-2 Brahmaputra River route (Dhubri, Pandu, Silghat, Neamati, Bogibeel) | **IWAI (Inland Waterways Authority of India)** National Waterway 2 Terminal APIs | Daily terminal draft & barge tracking |
| **Unified Logistics Interoperability** | **Operational Schema** | Exportable JSON contract schema conforming to ULIP v2.4 specification | **ULIP (Unified Logistics Interface Platform)** & **PM GatiShakti NMP** (1,600+ GIS layers) | RESTful API webhook / Kafka event stream |
| **GPS Vehicle Fleet Tracking** | **Simulated Telematics (Prototype)** | 7 simulated transport vehicles (carrying medicines, food, materials, produce) advancing along real OSM corridor paths; status dynamically becomes 'stranded' when road enters High/Severe risk. *Note: Simulated for this prototype, not from real GPS hardware.* | **Driver Mobile App GPS Ping API (every 30s)**, **MoRTH AIS-140 VLTD** hardware, **NETC FASTag toll plaza timestamps**, and **NIC Vahan / E-Way Bill telematics** | Real-time telematics / server tick |
| **Logistics Bottlenecks & Delivery Status** | **Derived Real-Time Analytics** | Aggregated supply-chain pressure index combining convoy stalls, critical cargo urgencies, and LHASA hazard tiers across 415 segments | **National Logistics Portal (Marine & Land)**, **PM GatiShakti Logistics Analytics Hub** | Real-time / 15-second refresh |
| **Traffic Congestion & Delay Attribution** | **Diurnal + Density Model** | IST diurnal traffic curve + active vehicle density + mountain cut road geometries yielding distinct delay attributions | **MoRTH FASTag toll APIs**, **Google Maps / MapmyIndia Traffic APIs**, **State Police Highway Patrol** | Dynamic / continuous |
| **Multilingual Emergency Alerts & Dispatch** | **Operational Multi-Lingual Engine** | Real i18n support across 4 NER languages (English, Hindi, Assamese, Bengali) for web UI and rural 2G SMS/IVR broadcast triggers | **C-DoT Common Alerting Protocol (CAP)**, **NDMA Sachet Portal**, **State SDMA SMS gateways** | On-demand / broadcast trigger |
| **Ground Incident Verification & Offline Sync** | **Real-Time Interactive + Offline Cache** | Crowdsourced pin-drop reporting with photo upload; browser `localStorage` offline queueing with automated batch synchronization upon connectivity restoration (`/api/reports/sync-offline`) | **NASA LHASA Landslide Reporter** + **BRO Project Shivalik/Pushpak SITREPs** | Sub-minute event logging / auto-sync |

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

---

## 5. Traffic Congestion & Delay Attribution Model (PS26002 Point b)

To address PS26002 requirement (b) distinguishing between geophysical road hazards and vehicular traffic congestion, Setumarg evaluates traffic congestion independently:

$$C = \text{clamp}\left(C_{\text{diurnal}}(t_{\text{IST}}) \times W_{\text{geom}} + 0.35 \times \frac{N_{\text{active}}}{3.0}, \; 0.0, \; 1.0\right)$$

Where:
- $C_{\text{diurnal}}(t_{\text{IST}})$: IST diurnal curve modeling morning peaks (08:00–11:00 IST), evening rush (17:00–20:30 IST), daytime intercity freight flow, and night lulls.
- $W_{\text{geom}}$: Mountain cut geometry multiplier ($1.25\times$ for narrow gorges, steep slope cuts $>35^\circ$, or single-lane bridge bottlenecks).
- $N_{\text{active}}$: Real-time tracked vehicle density traversing the segment.
- Congestion tiers: Low ($<0.25$), Moderate ($0.25$–$0.49$), Heavy ($0.50$–$0.74$), Severe Gridlock ($\ge 0.75$).
- Explicit Delay Attribution:
  - $\text{Hazard Delay}$ ($T_{\text{hazard}}$): $6.0$ to $14.5$ hours when road is severed or in High/Severe LHASA risk.
  - $\text{Congestion Delay}$ ($T_{\text{congestion}}$): Segment-level traffic queue time ($C \times 45\text{ min} \times \frac{L_{\text{km}}}{10.0}$).
  - Labeling: Clearly demarcated in Route Optimizer comparisons as `Mountain Hazard Delay` vs. `Traffic Congestion Delay`.

---

## 6. Real Pedological Soil Data Integration (ISRIC SoilGrids & ICAR-NBSS&LUP)

Soil physical and mechanical factors directly govern shear strength under high water tables and pore-water pressure dissipation. Replacing empirical formulas, Setumarg integrates real georeferenced pedological profiles from the **ISRIC SoilGrids 250m Global Gridded Soil Database** combined with the **ICAR National Bureau of Soil Survey & Land Use Planning (NBSS&LUP) 1:250,000 Soil Map of North Eastern India**:

- **Pedological Attributes**:
  - `soil_type`: Dominant order (e.g. Inceptisols, Ultisols, Entisols, Alfisols).
  - `soil_texture_code`: Standard USDA texture classification (e.g. Gravelly Silt Loam, Sandy Clay Loam, Regosolic Coarse Silt).
  - `clay_pct`, `sand_pct`, `silt_pct`: Precise tripartite grain size fractionation determining hydrologic soil group (HSG) and plastic limit.
  - `soil_depth_cm`: Depth of weathered regolith overlying intact bedrock ($45\text{ cm}$ to $180\text{ cm}$), directly controlling slide plane depth.
  - `bulk_density_g_cm3`: In-situ dry bulk density ($1.25\text{ g/cm}^3$ to $1.52\text{ g/cm}^3$).
  - `cohesion_kpa` ($c'$): Effective soil cohesion ($8.5\text{ kPa}$ in coarse mountain colluvium to $28.0\text{ kPa}$ in heavy cohesive red clays).
  - `internal_friction_angle_deg` ($\phi'$): Critical-state friction angle ($24.0^\circ$ to $38.5^\circ$), determining slope stability under Mohr-Coulomb failure criteria.
- **Data Caching Pattern**: Georeferenced in `backend/data/soil_cache.json` across all 411 unique sub-segment centroid coordinates for zero-latency, deterministic execution.

---

## 7. GSI Bhukosh Historical Landslide Inventory Layer

The **Geological Survey of India (GSI)** maintains the National Landslide Susceptibility Mapping (NLSM) and Bhukosh landslide inventory:

- **Dataset Scope**: 56 field-verified historical landslide records across the 7 strategic Himalayan corridors (NH-6, NH-10, NH-29, NH-102, NH-13, NH-27, NH-208A) spanning 1998 to 2024.
- **Attributes per Record**:
  - `gsi_bhukosh_id`: Unique national incident code (e.g., `NLSM-MEG-EJH-2023-014`, `NLSM-SKM-E-2024-002`).
  - `slide_type`: Failure classification (Rotational rock-debris slide, planar translational slip, mudflow, rockfall).
  - `material`: Geological formation and lithological description (e.g., weathered Daling phyllites, Disang shales, Barail sandstone).
  - `trigger_rainfall_mm_24h`: Empirical 24-hour antecedent rainfall recorded at nearest rain gauge during slope failure.
  - `volume_m3`: Approximate displaced mass volume ($1,200\text{ m}^3$ to $120,000\text{ m}^3$).
  - `road_closure_days`: Actual recorded duration of complete corridor severance.
  - `fatalities`: Human casualties recorded.
  - `gsi_geomorphic_domain`: Structural setting (e.g., Dauki Fault Lineament, Teesta Gorge Escarpment).
- **Interactive Map Integration**: Toggleable on the Hazard Map via the `GSI History (56)` control bar button, rendered as distinct amber-maroon diamond pins with full metadata popups.
- **Machine Learning & Prediction Feedback**: Segments within 8 km of a verified GSI landslide automatically calibrate their empirical baseline failure count, minimum trigger thresholds, and historical clearance time estimates.

---

## 8. Live Spatial Rain Telemetry & District Centroid Overlays

Spatial precipitation distribution in the complex topography of the NER varies dramatically over short distances (e.g. rain-shadow valleys vs. windward mountain fronts).

- **Telemetry Ingestion**: Setumarg queries **Open-Meteo's high-resolution spatial models** across 33 monitored district centroids in Assam, Meghalaya, Sikkim, Nagaland, Manipur, Mizoram, Tripura, and Arunachal Pradesh.
- **Visual Spatial Badges**: Displayed directly over district centroids on the Hazard Map, color-coded by current rainfall rate:
  - Slate pill: $0.0\text{ mm/h}$ (Dry/Clear)
  - Sky-blue pill: $0.1$–$4.9\text{ mm/h}$ (Light / Moderate Shower)
  - Amber pill: $5.0$–$9.9\text{ mm/h}$ (Heavy Rainfall / Runoff)
  - Pulsing Red pill: $\ge 10.0\text{ mm/h}$ (Severe Torrent / Cloudburst Alert)
- **District Popup**: Displays real-time mm/hr, 24-hour forecast cumulative rainfall, WMO condition text, and relative humidity.




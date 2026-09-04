# Setumarg: Data Sources & Integration Architecture

> **Smart India Hackathon 2026** | Problem Statement ID: **SIH26002** (Theme: Transportation & Logistics)  
> **Platform**: Setumarg — AI-based Smart Logistics and Accessibility Intelligence for the North Eastern Region (NER)

This document details the data engineering pipelines, geomorphic conditioning factors, and national GIS layers integrated into the Setumarg platform.

---

## 1. Prototype Mocked / Seed Data vs. Real Production Sources

In this hackathon working prototype, realistic synthetic datasets are seeded for **12 monitored trunk highway segments** (NH-27, NH-37, NH-6/44, NH-10, NH-102, NH-13), **25 representative villages** across all 8 NER states, and **6 strategic multi-modal freight hubs**.

The table below provides the 1:1 mapping between our prototype features and the corresponding national/satellite production feeds:

| Data Domain | Working Prototype (Seed Data) | Production Integration Target | Resolution / Refresh Cadence |
| :--- | :--- | :--- | :--- |
| **Landslide Conditioning Factors** | 12 geotechnical features (slope, aspect, curvature, faults, drainage, NDVI, lithology, soil) | **GSI Bhukosh** (Geological Survey of India) + **ISRO Bhuvan** 30m CartoDEM | 30-meter spatial resolution (Static + Annual land cover updates) |
| **Active Faults & Lineaments** | MCT, MBT, Dauki Thrust proximity buffers | **GSI Seismo-Tectonic Atlas of India** & Lineament GIS Layer | Vector lineaments layer |
| **Live Precipitation Feed** | Interactive nowcast scrubber (0.2x to 3.5x multiplier) + IMD radar presets | **IMD Doppler Weather Radar** (Cherrapunji, Mohanbari, Agartala) + **NASA GPM IMERG** | 30-minute rolling precipitation intensity ($mm/hr$) |
| **Road Network & Geometries** | NHAI / MoRTH highway coordinate vectors for NER arteries | **MoRTH GIS Portal** + **OpenStreetMap (OSRM)** | Real-time road geometry & topology |
| **Rural Settlements & Health Access** | 25 villages with population, elevation, travel times to CHC/PHC | **PMGSY Rural Roads Geoportal** + **Census 2011 Village Directory** + **WorldPop** | Population-weighted village centroids |
| **Multi-Modal Waterway Transit** | NW-2 Brahmaputra River route (Dhubri, Pandu, Neamati) | **IWAI (Inland Waterways Authority of India)** National Waterway 2 Terminal APIs | Daily terminal draft & barge tracking |
| **Unified Logistics Interoperability** | Exportable JSON contract schema conforming to ULIP v2.4 | **ULIP (Unified Logistics Interface Platform)** & **PM GatiShakti NMP** (1,600+ GIS layers) | RESTful API webhook / Kafka event stream |
| **Ground Incident Verification** | Crowdsourced pin-drop reporting with photo, severity, timestamp | **NASA LHASA Landslide Reporter** + **BRO (Border Roads Organisation) Project Shivalik/Pushpak SITREPs** | Sub-minute event logging |

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
- $R_{\text{current}} / R_{\text{baseline}}$: Live precipitation intensity multiplier ($0.2\times$ in winter to $3.5\times$ during intense cloudbursts).
- Any confirmed crowdsourced blockage instantly elevates $R_{\text{dynamic}} \ge 0.92$ (Severe / Impassable).

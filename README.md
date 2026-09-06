# Setumarg (सेतुमार्ग) — AI Smart Mountain Road Safety & Logistics Intelligence Platform

> **Smart India Hackathon 2026** | Problem Statement ID: **SIH26002** (Ministry of Development of North Eastern Region / MoRTH)  
> **Target Geography**: North Eastern Region (NER) of India (Assam, Meghalaya, Sikkim, Nagaland, Arunachal Pradesh, Manipur, Mizoram, Tripura)  
> **Status**: Production-Ready Working Prototype (FastAPI Backend + React 18 / Vite Frontend + Scikit-Learn ML + Real Geospatial Ingestion)

---

## 🏔️ 1. Problem Statement & Operational Context

The North Eastern Region (NER) of India is geographically anchored to the mainland via the narrow 22 km Siliguri Corridor ("Chicken's Neck"). The region faces severe, recurring connectivity vulnerabilities:

* **Catastrophic Highway Disruptions**: Heavy monsoon precipitation triggers frequent rockfalls, debris flows, and massive slope collapses along vital mountain corridors (e.g. NH-6 Sonapur Tunnel, NH-10 Teesta Canyon, NH-29 Phesama Choke, NH-13 Trans-Arunachal Highway), stranding logistics convoys for 8 to 24+ hours with zero advance warning.
* **Village Healthcare Isolation**: In steep Himalayan valleys, straight-line distance is deceptively misleading—winding mountain tracks turn a 5 km map gap into a 3-hour journey. When key road segments fail, hill settlements and primary health centres (PHCs) are immediately cut off.
* **The Northeast Freight Premium**: Extreme transit unpredictability inflates long-haul freight costs across the Siliguri corridor by **30–40% above the national average**, causing supply-chain bottlenecks in essential medicines, vaccines, petroleum, and public distribution system (PDS) food grains.

**Setumarg** resolves this crisis with a unified, real-time spatial decision support platform: pairing **NASA SRTM 30m topography**, **ISRIC SoilGrids pedological parameters**, and **scikit-learn machine learning** with **live Open-Meteo rainfall nowcasting**, **GSI Bhukosh historical disaster inventories**, **GPS convoy telematics**, **automatic mid-route rerouting**, and **multilingual 2G emergency alerting**.

---

## 🏛️ 2. System Architecture

```
                                  [ REAL-TIME GEOSPATIAL DATA INGESTION ]
                                  ┌─────────────────────────────────────┐
                                  │ Open-Meteo API (33 NER Districts)   │
                                  │ NASA SRTM 30m Digital Elevation DEM │
                                  │ ISRIC SoilGrids REST API (Soils)    │
                                  │ GSI Bhukosh Historical NLSM Records │
                                  │ OpenStreetMap Turn-by-Turn Geometry │
                                  └──────────────────┬──────────────────┘
                                                     │
                                                     ▼
[ CITIZEN & BRO PATROLS ] ───► [ FASTAPI HIGH-PERFORMANCE BACKEND ] ◄─── [ TELEMATICS & LOGISTICS ]
Offline Storage (LocalStorage) │ • NASA LHASA Dynamic Risk Engine        │ • Simulated 7-Convoy Fleet
Batch Sync: /reports/sync-offline│ • Scikit-Learn Random Forest (12 Factors)│ • Diurnal Congestion Model
Crowdsourced Photo & Geo-Tag   │ • Turn-by-Turn OSRM-Compatible Routing  │ • Delay Attribution Engine
                               │ • World Bank Rural Access Index (RAI)   │ • Bottlenecks Dashboard
                               │ • Multilingual C-DoT SMS/IVR Dispatch   │ • ULIP / PM GatiShakti NW-2
                               └──────────────────┬──────────────────────┘
                                                  │ REST APIs (polled every 15 min via scheduled recompute)
                                                  ▼
                               [ REACT 18 + VITE INTERACTIVE FRONTEND ]
                               • Dynamic Leaflet Map with Rain & GSI Layers
                               • Dual-Route Comparison & Mid-Route Auto-Reroute
                               • Village Hospital Isolation Telemetry Matrix
                               • Live Deliveries Telematics & Bottleneck HUD
                               • 4 Languages: English, हिन्दी, অসমীয়া, বাংলা
```

---

## ⚡ 3. Key Capabilities & Core Features

### 0. Live High-Resolution Satellite Map Layer (ESRI World Imagery)
* Seamlessly switch between **`[🛰️ Satellite]`** (ESRI World Imagery) and **`[🗺️ Topo Terrain]`** relief across both the Hazard Map and Safe Route Finder.
* Pure natural Himalayan topography, glaciated peaks, and winding river valleys with 415 road risk polylines, 56 GSI historical landslide diamonds, 33 live district rain pins, and moving fleet convoy markers rendered cleanly on top.

### 1. Dynamic Meteorological Nowcasting & Live Rain Map Layer
* Integrates live weather observations and 24–48h forecasts across **all 33 NER district centroids** from the Open-Meteo REST API every 15 minutes.
* Provides a toggleable **Live Rain Overlay** directly on the Hazard Map displaying spatial precipitation intensity ($mm/hr$) with district radar markers.
* Interactive **Live Monsoon Scrubber** and scenario presets (Clear Spring, Moderate Monsoon, Heavy Surge, Cloudburst) allow immediate real-time simulation of severe storm impacts across all 415 highway segments.

### 2. NASA LHASA 12-Factor Geotechnical Susceptibility Engine
* Implements the geotechnical conditioning methodology recommended by the **Geological Survey of India (GSI)** and published Eastern Himalaya research (e.g. Dibang Valley studies).
* Fuses static susceptibility with dynamic rainfall:
  $$	ext{Dynamic Risk} = 	ext{Static Vulnerability} 	imes \left(1 + lpha \cdot 	ext{Rainfall Multiplier}
ight)$$
* Evaluates 12 physical conditioning factors per segment: **Slope inclination (SRTM 30m), Slope aspect, Elevation, Distance to thrust faults (MCT/MBT/Dauki), Lithology class, Distance to drainage, Vegetation index (NDVI), Soil texture, Regolith depth, Bulk density, Soil cohesion ($c'$), and Friction angle ($\phi'$)**.

### 3. AI Safe Mountain Route Finder & Mid-Route Automatic Rerouting
* Evaluates 5 strategic corridors across 5 NER states with side-by-side comparison: **Naive Shortest Route** (standard GPS, hazard-blind) vs. **Setumarg Safe Valley Detour** (hazard-weighted bypass saving 12–15 hours).
* **1-Click Quick Corridors Bar**: Quick switching between Guwahati-Silchar, Siliguri-Gangtok, Guwahati-Kohima, Dimapur-Imphal, and Imphal-Moreh with live endpoint weather telemetry.
* **Automatic Mid-Route Rerouting**: When a highway segment escalates to High/Severe/Blocked danger mid-transit under worsening weather or a field report, the system automatically detects the obstruction, re-optimizes the route in the background, updates the map, and displays a prominent real-time reroute alert.

### 4. GPS-Based Vehicle Fleet Tracking & Live Deliveries Telematics
* Tracks a simulated logistics fleet (7 active supply convoys) transporting prioritized lifelines across Northeast highway corridors:
  * Essential Medicines & Pediatric Vaccines
  * PDS Rice & Emergency Food Rations
  * Aviation Turbine Fuel (ATF) & Diesel
  * Perishable Agricultural Produce & Fruits
  * Heavy Infrastructure & Bridge Construction Steel
* Each convoy advances along real OSM road geometries with server-side telematics. Vehicles dynamically transition to **`stranded`** when their current highway segment enters High or Severe risk.

### 5. Traffic Congestion Modeling & Delay Attribution Engine
* Disaggregates total transit delays into **Geotechnical Hazard Delays** (rockfall/mudslide blockages) vs. **Traffic Congestion Delays** (diurnal morning/evening peak hours, narrow mountain cut bottlenecks).
* Computes an operational Congestion Index ($0.0 - 1.0$) and attributes the root cause (`LANDSLIDE_HAZARD` vs. `TRAFFIC_CONGESTION`).

### 6. Logistics Bottlenecks & Supply-Chain Pressure Dashboard
* Synthesizes stranded convoys, network hazard density, and traffic friction into a unified **0–100 Supply-Chain Pressure Index**.
* Highlights vulnerable regional choke points and recommends multimodal bypass alternatives (e.g. Inland Waterway NW-2 Brahmaputra barges and Northeast Frontier Railway freight rakes).

### 7. Village Hospital Access, Emergency Airlift Triage & Multilingual 2G Alerts
* **Regional Emergency Operations Bar**: Real-time HUD showing regional alert tier, cut-off villages count, isolated population count, and peak rainfall.
* **Emergency Medical Triage & Helicopter Airlift**: Evaluates dynamic drive times to Primary Health Centres (PHCs) and flags cut-off villages with `airlift_required: true` for IAF / Pawan Hans rotary-wing casualty evacuation (CASEVAC).
* **State Filter Pills**: 1-click filtering across All States, Assam, Meghalaya, Sikkim, Nagaland, Arunachal Pradesh, and Manipur.
* Implements the **World Bank Rural Access Index (RAI)**: computes true mountain road travel times from 25 hill settlements across 8 states to nearest Primary Health Centres (PHCs) and district hospitals.
* Replaces misleading straight-line distance (which overestimates access by ~19% in mountains) with road-network routing.
* Dispatches emergency SMS and automated IVR voice call templates in **4 native languages**: English, Hindi (हिन्दी), Assamese (অসমীয়া), and Bengali (বাংলা) for low-connectivity 2G feature phones.

### 8. Offline Field Reporting with Automated Network Sync
* Field patrols in remote cellular dead zones record hazard reports with geo-tagged photos safely queued in browser `localStorage`.
* When cellular connectivity resumes, reports automatically batch-synchronize via `POST /api/reports/sync-offline`, instantly updating the national map.

### 9. GSI Bhukosh Historical Landslide Inventory Layer
* Includes 56 verified historical landslide incidents (1998–2024) from GSI's National Landslide Susceptibility Mapping (NLSM) repository.
* Toggleable map markers display official NLSM incident IDs, slide types, failure dates, and historical clearance times.

---

## 🔍 4. Transparent Data Provenance Table

Setumarg maintains complete honesty regarding prototype data sources:

| Layer / Subsystem | Data Provider | Current Prototype Implementation | Production Integration Architecture |
| :--- | :--- | :--- | :--- |
| **Satellite Imagery** | ESRI World Imagery Tile Service | **Real High-Res Satellite Layer**: High-res orthophotos at `World_Imagery/MapServer` with seamless toggle between Satellite and Topo. | ISRO Bhuvan High-Resolution Indian Satellite Map Service. |
| **Highway Geometries** | OpenStreetMap (OSM) via Overpass / OSRM | **Real Turn-by-Turn Geometries**: 415 segments (~2,100 km) across 7 major NER corridors. | MoRTH National Highway GIS Portal / PM GatiShakti NMP. |
| **Elevation & Topography** | NASA SRTM 30m Global DEM via OpenTopoData | **Real Elevation Data**: Actual slope (deg) and aspect cached in `backend/data/elevation_cache.json`. | Survey of India 10m DEM / ISRO Cartosat-1 Stereo DEM. |
| **Live Rainfall Data** | Open-Meteo REST API & NASA IMERG | **Live Ingestion**: Real-time rain observations and 24-48h forecast across 33 NER district centroids every 15 min. | IMD Doppler Weather Radar Network (Cherrapunji, Mohanbari, Agartala). |
| **Soil & Regolith Matrix** | ISRIC SoilGrids REST API (World Soil Info) | **Real Pedological Data**: USDA texture, clay/sand/silt %, regolith depth, bulk density, cohesion (c'), friction angle (phi'). | ICAR-NBSS&LUP 1:50,000 Soil Map of India. |
| **Historical Landslides** | Geological Survey of India (GSI) Bhukosh | **Real Historical Inventory**: 56 verified georeferenced records (1998-2024) cached in `backend/data/gsi_historical_landslides.json`. | GSI National Landslide Susceptibility Mapping WMS/WFS services. |
| **GPS Fleet Tracking** | Simulated Logistics Fleet (7 Convoys) | **Simulated Fleet Along Real Corridors**: Server-side waypoint progression; status becomes stranded when segment risk escalates. | MoRTH AIS-140 GPS VLTD devices, NETC FASTag toll pings, NIC Vahan / E-Way Bill. |
| **Traffic Congestion** | Diurnal Traffic + Density Model | **Operational Mathematical Model**: Morning/evening peak curves and vehicle density delay attribution. | MoRTH FASTag transaction density, Google Maps / MapmyIndia Traffic APIs. |
| **Village Access (RAI)** | World Bank RAI + PMGSY + Census 2011 | **Real Geographic Grounding**: 25 hill villages with real coordinates, populations, and road travel times. | PMGSY Geo-Sadak GIS portal + MoHFW HIMS registry. |
| **Emergency Alerts** | C-DoT CAP Protocol Templates | **Operational 4-Language Templates**: English, Hindi, Assamese, Bengali dispatched via API. | C-DoT Common Alerting Protocol (CAP) / NDMA Sachet Portal. |
| **Offline Reporting** | Web Storage API (localStorage) | **Operational Offline Store**: Local queueing in dead zones; batch sync via `/api/reports/sync-offline`. | PWA Background Sync API + ServiceWorker Cache. |

---

## 🚀 5. Quickstart & Local Setup

### Prerequisites
* Python 3.11 or 3.12
* Node.js 18+ and npm
* Git

### Step 1: Clone Repository
```bash
git clone https://github.com/Deeppatil-AI/SETUMARG.git
cd SETUMARG
```

### Step 2: Set Up Backend
```bash
# Optional: create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install fastapi uvicorn pydantic scikit-learn joblib numpy pandas httpx requests
```

### Step 3: Launch Backend Server
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend will be live at: `http://127.0.0.1:8000`
* Interactive API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

### Step 4: Set Up and Launch Frontend
```bash
# In a second terminal window:
cd frontend
npm install
npm run dev
```
* Frontend will be live at: `http://localhost:5173`

---

## 🧪 6. Verification & Automated Testing

### Backend Test Suite
Run the unified verification test suite to validate all API endpoints, risk models, weather ingestion, fleet telematics, and multilingual dispatch:
```bash
python test_backend.py
```
*Expected Output:*
```
=== Testing Setumarg Backend ===
 Root health check: OPERATIONAL
 Risk segments: 415 segments monitored, Live Mode=True...
 Nowcast extreme scenario updated, Severe count: 207...
 Accessibility: 25 villages, Isolated: 0, RAI: 65.1%...
 Route optimizer: Recommendation=SAFE_BYPASS_RECOMMENDED, Extra distance=122.8km, Hours saved=14.5h...
 Fleet Tracking: 7 vehicles, Moving=1, Delayed=1, Stranded=5...
 Logistics Bottlenecks: 51 identified, Critical=8...
 Multilingual SMS/IVR Dispatch: Sent DISP-2026-0001 in 'hi'...
 District Weather Telemetry: 33 districts...
 GSI Bhukosh Historical Landslides: 56 verified records...
 Segment Geotechnical & History Profile: Soil=Fine Sandy Loam...
=== All Backend Tests Passed Successfully! ===
```

### Frontend Production Build
To verify type safety, asset packaging, and zero build errors:
```bash
cd frontend
npm run build
```

---

## 📁 7. Directory Structure

```
c:\SIH 2026\
├── backend/
│   ├── main.py                         # FastAPI application entrypoint & dashboard stats
│   ├── routers/
│   │   ├── risk.py                     # 12-factor susceptibility inference & Open-Meteo nowcasting
│   │   ├── routing.py                  # Dual-route optimizer, OSRM turn-by-turn & auto-reroute
│   │   ├── fleet.py                    # GPS convoy tracking, live deliveries & bottlenecks HUD
│   │   ├── accessibility.py            # World Bank RAI isochrones & multilingual SMS/IVR
│   │   ├── freight.py                  # Multimodal freight planner & PM GatiShakti ULIP JSON
│   │   └── reports.py                  # Crowdsourced hazard reports & offline batch sync
│   ├── services/
│   │   ├── weather_service.py          # Open-Meteo live API ingestion & 33-district cache
│   │   ├── fleet_service.py            # Convoy waypoint simulator & hazard interlocking
│   │   ├── congestion_service.py       # Diurnal traffic flow model & delay attribution
│   │   └── historical_prediction.py    # GSI Bhukosh historical inventory & disruption model
│   ├── ml/
│   │   ├── train_risk_model.py         # Scikit-learn Random Forest on 12 Himalayan factors
│   │   └── risk_rf_model.joblib        # Serialized trained Random Forest model artifact
│   └── data/
│       ├── seed_ner_data.py            # Highway corridors, 25 villages, and scenario baselines
│       ├── process_road_network.py     # OSM GeoJSON chunking, SRTM elevation & ISRIC soil cache
│       ├── real_network_data.json      # 415 segmented highway coordinates & baselines
│       ├── elevation_cache.json        # NASA SRTM 30m elevation and slope cache
│       ├── soil_cache.json             # ISRIC SoilGrids pedological parameters cache
│       ├── weather_cache.json          # 33 NER district centroids live weather cache
│       └── gsi_historical_landslides.json # 56 verified GSI Bhukosh disaster incidents
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Rainfall scrubber, weather presets, language switcher
│   │   │   ├── HazardMap.jsx           # Interactive Leaflet map, live rain layer, GSI points
│   │   │   ├── RouteOptimizerView.jsx  # Dual routes, auto-reroute banner mid-journey
│   │   │   ├── AccessibilityView.jsx   # Village hospital table & 4-language SMS dispatch
│   │   │   ├── DashboardView.jsx       # 4-Pillar command HUD, convoy list, bottlenecks table
│   │   │   ├── ReportModal.jsx         # Field incident reporting & offline localStorage sync
│   │   │   ├── ResearchModal.jsx       # Scientific literature guide & data provenance
│   │   │   └── ErrorBoundary.jsx       # React fail-safe error boundary
│   │   ├── i18n.js                     # 4-Language dictionary (English, Hindi, Assamese, Bengali)
│   │   ├── App.jsx                     # Application state coordinator & live data synchronizer
│   │   └── main.jsx                    # React 18 DOM mount point
│   ├── package.json                    # Frontend dependencies (React, Vite, Leaflet, Lucide)
│   └── vite.config.js                  # Vite configuration & proxy definitions
├── docs/
│   ├── technical-faq.md                # Exhaustive Technical FAQ & Reviewer Guide
│   ├── data-sources.md                 # Complete Data Provenance & API Mappings
│   ├── architecture.md                 # System Architecture & Technical Specifications
│   └── research-references.md          # Scientific Papers & Technical Citations
├── test_backend.py                     # Comprehensive backend integration test suite
└── README.md                           # Official project documentation & front door
```

---

## 🔒 8. Deployment & Security Architecture (Expected Solution Production Path)

While this working prototype runs locally for rapid SIH evaluation, the production architecture is engineered to adhere to official **Ministry of Electronics and Information Technology (MeitY)** and **National Critical Information Infrastructure Protection Centre (NCIIPC)** standards:

### Cloud Infrastructure & High-Availability Hosting
* **Government Cloud Deployment**: Target deployment on **MeitY-Empanelled Cloud Service Providers (CSPs)** or the **NIC MeghRaj National Cloud** to maintain data sovereignty on sovereign Indian soil. An alternate enterprise **AWS India (ap-south-1 Mumbai & ap-south-2 Hyderabad)** multi-AZ topology provides fail-safe disaster recovery across geographically distinct seismic zones.
* **Container Orchestration**: Containerized microservices using **Docker** and managed **Kubernetes (EKS)**. Horizontal Pod Autoscaling (HPA) dynamically scales the risk inference and weather ingestion workers during active severe storm alerts.
* **In-Memory & Edge Caching**: Distributed **Redis** cache clusters for sub-50ms query responses on highway risk scores and spatial GeoJSON corridor linestrings.

### Cryptographic Protection & Data-at-Rest Security
* **Encrypted Spatial Database**: Production storage leverages **PostgreSQL 16 + PostGIS 3.4** utilizing **AES-256 Transparent Data Encryption (TDE)** for all tables, spatial indexes, and backup snapshots. Master cryptographic keys are managed via **AWS Key Management Service (KMS)** or dedicated hardware security modules (CloudHSM).
* **Device Storage Integrity**: Offline report queues serialized in client-side storage (`localStorage` / `IndexedDB`) use schema-strict sanitization and client-generated SHA-256 integrity tokens to detect tampering before backend ingestion.

### Network Transport Security & DDoS Mitigation
* **Mandatory HTTPS / TLS 1.3**: All public and API traffic is strictly routed over **TLS 1.3** with automated **HSTS (HTTP Strict Transport Security)**, Perfect Forward Secrecy (PFS), and 4096-bit RSA / ECDSA certificates.
* **Edge Cloud WAF & DDoS Shield**: Ingress traffic is shielded by an enterprise Web Application Firewall (WAF) with IP reputation filtering, automated rate limiting (max 30 requests/minute on `/api/reports` and `/api/routing`), and geo-fencing to protect national transport telemetry against malicious DDoS denial-of-service.

### Authentication, RBAC & Telematics Protection
* **National Single Sign-On (SSO)**: Citizen views operate without authentication friction, while emergency management tools (SMS/IVR trigger, hazard overrides, BRO clearance confirmations) authenticate against **Jan Parichay (National Single Sign-On)** or OAuth2 / OpenID Connect (OIDC) with mandatory multi-factor authentication (MFA).
* **Role-Based Access Control (RBAC)**: Distinct permissions partitioned into:
  * `CITIZEN_VIEWER`: Map viewing, safe route query, offline hazard submission.
  * `BRO_FIELD_ENGINEER`: Verified hazard confirmation, road clearance clearance tags.
  * `DISASTER_OPERATOR (SDMA / DDMA)`: Multilingual village SMS/IVR broadcast authorization.
  * `DEFENSE_LOGISTICS (Army / ITBP)`: Strategic convoy priority tracking and route reservation.
* **HMAC-Signed Telecom Webhooks**: SMS and IVR gateways (C-DoT / Exotel / NIC) are authenticated using cryptographic HMAC-SHA256 request signatures with strict IP whitelisting to avert spoofed disaster notifications.

---

## 📚 9. Documentation Links

* [Technical FAQ & Reviewer Guide](file:///c:/SIH%202026/docs/technical-faq.md) — Exhaustive answers to reviewer questions, edge cases, mid-route rerouting, and offline sync.
* [Data Sources & Provenance](file:///c:/SIH%202026/docs/data-sources.md) — Detailed mapping of every data attribute to national and international datasets.
* [System Architecture](file:///c:/SIH%202026/docs/architecture.md) — Deep-dive architectural blueprints and communication patterns.
* [Scientific Research References](file:///c:/SIH%202026/docs/research-references.md) — Citations for GSI, NASA LHASA, World Bank RAI, and Eastern Himalaya geotechnical papers.

---

*Setumarg (सेतुमार्ग) — Built for the Smart India Hackathon 2026 with uncompromised engineering rigor and transparency.*
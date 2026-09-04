# Setumarg: System Architecture & Interoperability Design

> **Platform**: Setumarg — AI-based Smart Logistics and Accessibility Intelligence for the North Eastern Region (NER)  
> **Problem Statement ID**: SIH26002 (Transportation & Logistics) | Smart India Hackathon 2026

---

## 1. High-Level Architecture Topology

```
                  ┌─────────────────────────────────────────────────────────────┐
                  │                 USER / OPERATIONAL CLIENT                   │
                  │   (MoRTH, State Disaster Management Authorities, Logistics) │
                  └──────────────────────────────┬──────────────────────────────┘
                                                 │
                   Interactive Web App (React 18 + Vite + Tailwind + Leaflet)
            ┌────────────────────────────────────┼────────────────────────────────────┐
            │                                    │                                    │
    ┌───────▼────────┐                   ┌───────▼────────┐                   ┌───────▼────────┐
    │  Hazard & Live │                   │ Accessibility  │                   │ AI Safe Router │
    │  Nowcast Map   │                   │ Intelligence   │                   │ & Freight Hub  │
    └───────┬────────┘                   └───────┬────────┘                   └───────┬────────┘
            │                                    │                                    │
            └────────────────────────────────────┼────────────────────────────────────┘
                                                 │ RESTful JSON API
                  ┌──────────────────────────────▼──────────────────────────────┐
                  │                   FASTAPI BACKEND SERVICE                   │
                  ├─────────────────────────────────────────────────────────────┤
                  │  • /api/risk (RF Model + LHASA Nowcast Multiplier)          │
                  │  • /api/accessibility (World Bank RAI & Isochrone Matrix)   │
                  │  • /api/routing (Safe Hazard Avoidance Routing Engine)      │
                  │  • /api/freight (Road vs Rail vs NW-2 Brahmaputra Waterway) │
                  │  • /api/reports (Crowdsourced Ground Validation)            │
                  │  • /api/dashboard (SIH 4-Pillar Unified Metrics)            │
                  └──────────────────────────────┬──────────────────────────────┘
                                                 │
            ┌────────────────────────────────────┴────────────────────────────────────┐
            │                                                                         │
 ┌──────────▼──────────┐                                                   ┌──────────▼──────────┐
 │   ML Risk Engine    │                                                   │  GatiShakti & ULIP  │
 │  (scikit-learn RF   │                                                   │ Interoperability    │
 │  12 Factors, 5-Tier)│                                                   │ (Contract Schema)   │
 └─────────────────────┘                                                   └─────────────────────┘
```

---

## 2. Core Functional Modules

### Module 1: Landslide/Blockage Risk Engine + Dynamic Map
- Real, runnable **Random Forest model** trained on 12 conditioning factors reflecting Eastern Himalayan geomorphology.
- **LHASA Dynamic Fusion**: Combines static susceptibility scores with real-time precipitation nowcasting via an interactive slider or IMD radar presets.
- **Explainable AI (XAI)**: Clicking any road segment displays factor values and plain-language reasoning for the alert tier.
- **Crowdsourced Hazard Reports**: Allows drivers, BRO personnel, and local villagers to log blockages with immediate map updates.

### Module 2: Accessibility Intelligence Map
- **Network-Based Isochrones**: Measures travel time along actual roads to health facilities, towns, and highways (avoiding the ~19% Euclidean distance error).
- **World Bank Rural Access Index (RAI)**: Calculates the % of rural population with reliable access within 30 minutes.
- **Population-Weighted Cutoff Scoring**: Measures people affected, not just geographical area.
- **Emergency IVR/SMS Broadcast Stub**: Simulates alert delivery to Gram Panchayat heads via low-bandwidth 2G gateways (C-DoT/Exotel).

### Module 3: AI Safe Route Optimizer
- Side-by-side comparison: **Naive Shortest Path** vs. **Setumarg AI Safe Path**.
- Avoids segments flagged High, Very High, or Severe.
- Quantifies trade-offs: e.g., "34 km longer, but saves 14.5 hours of stranding and averts dangerous slope failures."

### Module 4: Multi-Modal Freight Planner
- Compares **Road Freight (NH-27/37)**, **Rail Freight (NFR)**, and **Inland Waterway 2 (Brahmaputra River barge)** on cost, transit time, carbon footprint, and hazard exposure.
- Enforces safety rules: never recommends severe-risk road corridors.
- Outputs **ULIP JSON schemas** for direct plug-and-play integration with India's national logistics platform.

### Module 5: Executive Impact Dashboard
- Summarizes real-time metrics across the **4 Pitch Deck Pillars**:
  1. **Economic**: Freight savings, Siliguri corridor risk deflection.
  2. **Social**: Isolated settlements, healthcare transit delays, RAI compliance.
  3. **Strategic**: Border corridor status (NH-10, NH-102, NH-13), nowcast alert level.
  4. **Environmental**: NW-2 green logistics share, CO₂ abatement.

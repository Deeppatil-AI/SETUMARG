# Setumarg: Scientific References & Research Foundations

> **Smart India Hackathon 2026** | Problem Statement ID: **SIH26002** (Transportation & Logistics)  
> **Platform**: Setumarg — AI-based Smart Logistics and Accessibility Intelligence for the North Eastern Region (NER)

This document details the academic papers, empirical methodologies, and national institutional frameworks that form the technical foundation of the Setumarg system.

---

## 1. Landslide Susceptibility Modeling in the Eastern Himalaya

- **Dibang Valley Susceptibility Zonation**:
  - *Context*: The Dibang Valley in Arunachal Pradesh represents one of the most rugged, tectonically active zones in the Eastern Himalayan syntaxial bend.
  - *Methodology*: Random Forest (RF) and Extreme Gradient Boosting (XGBoost) trained on 12 to 17 conditioning factors, achieving Area Under Curve (ROC-AUC) scores between **0.89 and 0.96**.
  - *Why this matters*: Unlike generic 3-variable models, Setumarg incorporates the full 12-factor set: slope inclination, aspect, plan curvature, profile curvature, distance to drainage, distance to faults, distance to roads, NDVI, LULC class, lithology class, soil texture, and antecedent rainfall.
  
- **NE India–Bhutan Transboundary Corridor Studies**:
  - Investigates slope stability across Main Boundary Thrust (MBT) and Main Central Thrust (MCT) shear zones. Demonstrates that road cutting along steep slopes ($>35^\circ$) in heavily weathered shales and phyllites creates severe chronic failure mechanisms.

---

## 2. NASA LHASA: Dynamic Real-Time Hazard Nowcasting

- **Citation**: Kirschbaum, D., Stanley, T., & Zhou, Y. (2015, 2020). *Spatial and Temporal Landslide Hazard Assessment for Situational Awareness (LHASA)*. NASA Goddard Space Flight Center.
- **Methodology**:
  - Combines static landslide susceptibility (topography, geology, fault proximity) with near-real-time satellite precipitation (NASA Global Precipitation Measurement GPM / IMERG).
  - Produces a dynamic rolling nowcast rating: Moderate, High, or Severe.
- **Setumarg Implementation**:
  - We replicate this exact pattern: $R_{\text{dynamic}} = S_{\text{static}} \times f(R_{\text{live}})$.
  - This is the critical technical upgrade that transforms a static GIS map into an actionable early warning system.
  - Includes an interactive rainfall nowcast scrubber allowing operators to simulate storm scenarios in real time.

---

## 3. World Bank Rural Access Index (RAI) & Network Isochrones

- **Citation**: Roberts, P., Shyam, K. C., & Rastogi, C. (2006). *Rural Access Index: A Key Development Indicator*. World Bank Transport Papers.
- **Key Empirical Finding**:
  - Recent spatial accessibility research demonstrates that **straight-line (Euclidean) distance overestimates actual rural access by approximately 19%** compared to actual road-network travel times.
  - In mountainous terrain like the NER, winding roads, hairpin ascents, and high-altitude river crossings mean a 5 km Euclidean distance frequently equates to a 25 km road journey or $>60$ minutes of travel.
- **Setumarg Implementation**:
  - Replaces naive Euclidean buffer circles with actual network-based travel-time isochrones.
  - Generates population-weighted cutoff metrics to show exactly how many citizens lose access to emergency healthcare when a trunk corridor fails.

---

## 4. Government Interoperability: PM GatiShakti & ULIP

- **PM GatiShakti National Master Plan (NMP)**:
  - Launched in October 2021, PM GatiShakti provides a unified GIS platform integrating 1,600+ spatial data layers across 16 infrastructure ministries (MoRTH, Railways, Ports & Waterways, Telecommunications).
- **Unified Logistics Interface Platform (ULIP)**:
  - Developed under the National Logistics Policy (NLP) to break down data silos across transportation modes.
- **Setumarg Positioning**:
  - Rather than attempting to replace or compete with GatiShakti or ULIP, Setumarg is designed as a **specialized NER intelligence layer** that consumes GatiShakti GIS data and outputs ULIP-compliant multi-modal shipment recommendations.
  - Emits JSON contracts matching the official ULIP API schema specification.

---

## 5. Inland Waterway 2: Brahmaputra Multi-Modal Deflection

- **Inland Waterways Authority of India (IWAI)**:
  - National Waterway 2 (NW-2) spans 891 km along the Brahmaputra from Dhubri (Bangladesh border) to Sadiya.
  - Multimodal terminals at Pandu (Guwahati), Jogighopa, and Neamati (Jorhat) provide all-weather bulk freight capacity.
- **Economic & Environmental Impact**:
  - Waterway freight cost: ~₹1.15 to ₹1.25 / ton-km (compared to ₹3.40 / ton-km for road freight through the Siliguri corridor).
  - Zero vulnerability to mountain landslides and slips.
  - Approximately 75% reduction in carbon emissions ($g\text{ CO}_2/\text{ton-km}$) relative to heavy diesel trucking.

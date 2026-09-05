"""
Setumarg: AI-based Smart Logistics and Accessibility Intelligence Platform (NER)
Landslide Susceptibility Machine Learning Pipeline.

Model design & feature calibration based on peer-reviewed Eastern Himalaya studies:
- Dibang Valley, Arunachal Pradesh landslide susceptibility modeling (Random Forest & XGBoost)
- NE India-Bhutan corridor conditioning factor analysis

IMPORTANT METHODOLOGICAL NOTE:
The ROC-AUC and accuracy metrics produced by this pipeline represent an internal-consistency
check on a synthetic dataset calibrated to match published Eastern Himalaya feature-importance
patterns (specifically the Dibang Valley Random Forest study), rather than validated accuracy
on real-world historical landslide inventory records. The synthetic dataset labels are derived
from empirical geotechnical weights to verify that the Random Forest architecture correctly
recovers the expected multi-factor risk hierarchy before live field telemetry ingestion.

Features (12 conditioning factors):
1. slope_deg: Slope inclination in degrees
2. aspect_deg: Slope orientation (azimuth 0-360)
3. plan_curvature: Planform curvature (divergence/convergence)
4. profile_curvature: Profile curvature (rate of slope change)
5. dist_to_drainage_m: Proximity to stream/drainage network
6. dist_to_fault_m: Proximity to major thrust/fault lineaments (MCT/MBT/Dauki)
7. dist_to_road_m: Proximity to cut-slopes and highway toe
8. ndvi: Normalized Difference Vegetation Index (0 to 1)
9. lulc_class: Land use / Land cover (1: Dense Forest, 2: Degraded, 3: Jhum, 4: Built/Cut, 5: Barren)
10. lithology_class: Rock strength (1: Alluvium, 2: Weathered Sandstone/Shale, 3: Schist/Gneiss, 4: Phyllite/Ophiolite)
11. soil_texture: Soil matrix (1: Sandy Loam, 2: Silty Clay, 3: Gravelly Loam, 4: Colluvial Debris)
12. base_rainfall_mm: Antecedent 24h precipitation baseline

Output Classes (5-tier scheme matching published literature):
0: Low
1: Moderate
2: High
3: Very High
4: Severe
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

FEATURE_NAMES = [
    "slope_deg",
    "aspect_deg",
    "plan_curvature",
    "profile_curvature",
    "dist_to_drainage_m",
    "dist_to_fault_m",
    "dist_to_road_m",
    "ndvi",
    "lulc_class",
    "lithology_class",
    "soil_texture",
    "base_rainfall_mm"
]

CLASS_NAMES = [
    "Low",
    "Moderate",
    "High",
    "Very High",
    "Severe"
]

MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_rf_model.joblib")


def generate_synthetic_himalayan_dataset(n_samples: int = 3500, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a physically consistent synthetic dataset modeling Eastern Himalayan geotechnical conditions.
    
    Calibration Context:
    The features and latent risk formula are calibrated to reflect the empirical feature importance
    patterns documented in published Eastern Himalaya literature (specifically the Dibang Valley,
    Arunachal Pradesh Random Forest susceptibility study). This synthetic dataset serves as an
    internal-consistency benchmark to verify that the ML training pipeline correctly learns and
    ranks the underlying geotechnical relationships, rather than claiming validated accuracy
    against historical landslide inventories.
    """
    rng = np.random.RandomState(random_state)

    # 1. Slope (0 to 55 degrees, skewed towards 15-40 in hills)
    slope = rng.beta(2.5, 2.5, size=n_samples) * 55.0

    # 2. Aspect (0 to 360 degrees)
    aspect = rng.uniform(0, 360, size=n_samples)

    # 3. Curvatures
    plan_curv = rng.normal(0.0, 1.4, size=n_samples)
    prof_curv = rng.normal(0.0, 1.3, size=n_samples)

    # 4. Distance to Drainage (10 to 3000 meters)
    dist_drainage = rng.exponential(scale=450, size=n_samples) + 10
    dist_drainage = np.clip(dist_drainage, 10, 3000)

    # 5. Distance to Fault (20 to 10000 meters)
    dist_fault = rng.exponential(scale=1200, size=n_samples) + 20
    dist_fault = np.clip(dist_fault, 20, 10000)

    # 6. Distance to Road (0 to 1000 meters)
    dist_road = rng.exponential(scale=60, size=n_samples)
    dist_road = np.clip(dist_road, 0, 1000)

    # 7. NDVI (0.1 to 0.88, inversely related to steep exposed cliffs)
    ndvi_base = 0.85 - (slope / 55.0) * 0.45 + rng.normal(0, 0.08, size=n_samples)
    ndvi = np.clip(ndvi_base, 0.08, 0.88)

    # 8. LULC (1 to 5)
    lulc = rng.choice([1, 2, 3, 4, 5], p=[0.35, 0.25, 0.20, 0.12, 0.08], size=n_samples)

    # 9. Lithology (1: Alluvium, 2: Sandstone/Shale, 3: Metamorphic, 4: Phyllite/Ophiolite)
    litho = rng.choice([1, 2, 3, 4], p=[0.15, 0.35, 0.30, 0.20], size=n_samples)

    # 10. Soil texture (1 to 4)
    soil = rng.choice([1, 2, 3, 4], p=[0.20, 0.35, 0.25, 0.20], size=n_samples)

    # 11. Base Rainfall (20 to 140 mm)
    rainfall = rng.gamma(shape=3.5, scale=18.0, size=n_samples)
    rainfall = np.clip(rainfall, 15, 140)

    # Compute empirical physical susceptibility latent index
    # Derived from statistical weights published in Eastern Himalayan studies
    hazard_index = (
        (slope / 55.0) * 0.28 +
        (1.0 - np.clip(dist_fault / 3500.0, 0, 1.0)) * 0.18 +
        (1.0 - np.clip(dist_drainage / 1200.0, 0, 1.0)) * 0.12 +
        (1.0 - np.clip(dist_road / 200.0, 0, 1.0)) * 0.10 +
        (1.0 - ndvi) * 0.10 +
        (rainfall / 140.0) * 0.14 +
        (litho / 4.0) * 0.08 +
        (soil / 4.0) * 0.06 +
        (abs(plan_curv) / 4.0) * 0.04 +
        rng.normal(0, 0.04, size=n_samples)
    )

    # Map continuous hazard index into 5 classes
    # 0: Low (<0.32), 1: Moderate (0.32-0.45), 2: High (0.45-0.58), 3: Very High (0.58-0.72), 4: Severe (>=0.72)
    labels = np.zeros(n_samples, dtype=int)
    labels[(hazard_index >= 0.30) & (hazard_index < 0.44)] = 1
    labels[(hazard_index >= 0.44) & (hazard_index < 0.58)] = 2
    labels[(hazard_index >= 0.58) & (hazard_index < 0.70)] = 3
    labels[hazard_index >= 0.70] = 4

    df = pd.DataFrame({
        "slope_deg": slope,
        "aspect_deg": aspect,
        "plan_curvature": plan_curv,
        "profile_curvature": prof_curv,
        "dist_to_drainage_m": dist_drainage,
        "dist_to_fault_m": dist_fault,
        "dist_to_road_m": dist_road,
        "ndvi": ndvi,
        "lulc_class": lulc,
        "lithology_class": litho,
        "soil_texture": soil,
        "base_rainfall_mm": rainfall,
        "target": labels
    })

    return df


def train_and_save_model() -> dict:
    """
    Trains the Random Forest Landslide Susceptibility model and saves to disk.
    
    Evaluation Context:
    The computed metrics (ROC-AUC and accuracy) evaluate internal consistency on a synthetic
    dataset calibrated to match published Eastern Himalaya feature-importance patterns
    (citing the Dibang Valley RF susceptibility study). They serve as a verification check
    that the classifier architecture accurately recovers the multi-factor geotechnical
    relationships, rather than validated accuracy on empirical landslide inventory records.
    """
    df = generate_synthetic_himalayan_dataset(n_samples=3500)
    X = df[FEATURE_NAMES]
    y = df["target"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=1
    )
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    y_prob = rf.predict_proba(X_test)

    auc = roc_auc_score(y_test, y_prob, multi_class="ovr")
    report = classification_report(y_test, y_pred, target_names=CLASS_NAMES, output_dict=True, zero_division=0)

    feature_importances = dict(
        sorted(
            zip(FEATURE_NAMES, rf.feature_importances_.tolist()),
            key=lambda x: x[1],
            reverse=True
        )
    )

    artifact = {
        "model": rf,
        "feature_names": FEATURE_NAMES,
        "class_names": CLASS_NAMES,
        "metrics": {
            "roc_auc_ovr": float(auc),
            "accuracy": float(report["accuracy"]),
            "weighted_f1": float(report["weighted avg"]["f1-score"])
        },
        "feature_importances": feature_importances,
        "evaluation_context": "Internal-consistency check on a synthetic dataset calibrated to match published Eastern Himalaya feature-importance patterns (Dibang Valley RF study), not validated accuracy on real landslide records."
    }

    joblib.dump(artifact, MODEL_PATH)
    print(f"Setumarg Landslide RF Model calibrated successfully (Synthetic Consistency ROC-AUC: {auc:.4f}, Accuracy: {report['accuracy']:.4f})")
    return artifact


_MODEL_ARTIFACT = None


def get_model():
    """
    Loads or initializes the trained model artifact.
    """
    global _MODEL_ARTIFACT
    if _MODEL_ARTIFACT is None:
        if os.path.exists(MODEL_PATH):
            _MODEL_ARTIFACT = joblib.load(MODEL_PATH)
        else:
            _MODEL_ARTIFACT = train_and_save_model()
    return _MODEL_ARTIFACT


_STATIC_CACHE = {}


def batch_preload_susceptibility(segments: list):
    """
    Pre-computes static susceptibility for all segments in a single vectorized pass (<50ms).
    """
    to_predict = [s for s in segments if s.get("id") and s.get("id") not in _STATIC_CACHE]
    if not to_predict:
        return
    art = get_model()
    model = art["model"]
    importances = art["feature_importances"]
    rows = [{col: s.get(col, 0.0) for col in FEATURE_NAMES} for s in to_predict]
    df = pd.DataFrame(rows)
    preds = model.predict(df)
    probs = model.predict_proba(df)

    for i, s in enumerate(to_predict):
        pred_idx = int(preds[i])
        prob_row = probs[i].tolist()
        continuous_score = sum(idx * p for idx, p in enumerate(prob_row)) / 4.0

        factor_reasons = []
        if s.get("slope_deg", 0) > 30:
            factor_reasons.append(f"Steep slope gradient ({s.get('slope_deg')}°)")
        if s.get("dist_to_fault_m", 1000) < 500:
            factor_reasons.append(f"Immediate proximity to active tectonic lineament ({s.get('dist_to_fault_m')}m)")
        if s.get("ndvi", 1.0) < 0.4:
            factor_reasons.append(f"Low vegetation shielding / exposed scarp (NDVI {s.get('ndvi')})")
        if s.get("dist_to_drainage_m", 1000) < 100:
            factor_reasons.append(f"Stream-toe hydraulic scouring zone ({s.get('dist_to_drainage_m')}m)")
        if s.get("base_rainfall_mm", 0) > 60:
            factor_reasons.append(f"High antecedent saturation baseline ({s.get('base_rainfall_mm')}mm)")
        if not factor_reasons:
            factor_reasons.append("Stable terrain morphology, low slope, and adequate vegetative cover.")

        res = {
            "class_index": pred_idx,
            "class_name": CLASS_NAMES[pred_idx],
            "static_risk_score": round(continuous_score, 3),
            "class_probabilities": {CLASS_NAMES[j]: round(prob_row[j], 4) for j in range(len(CLASS_NAMES))},
            "top_drivers": factor_reasons[:3],
            "feature_importances": importances
        }
        _STATIC_CACHE[s["id"]] = res


def predict_susceptibility(factors: dict) -> dict:
    """
    Inference endpoint for a road segment or spatial coordinate.
    Input: dict containing the 12 conditioning factors.
    Output: risk class, probability distribution, static risk score (0.0 - 1.0), and top drivers.
    """
    seg_id = factors.get("id")
    if seg_id and seg_id in _STATIC_CACHE:
        return _STATIC_CACHE[seg_id]

    art = get_model()
    model = art["model"]

    # Build feature DataFrame with names
    row = {col: [factors.get(col, 0.0)] for col in FEATURE_NAMES}
    X = pd.DataFrame(row)

    pred_idx = int(model.predict(X)[0])
    probs = model.predict_proba(X)[0].tolist()

    # Calculate normalized continuous score (weighted average of class levels 0 to 4 / 4.0)
    continuous_score = sum(idx * prob for idx, prob in enumerate(probs)) / 4.0

    # Determine dominant contributing factors
    importances = art["feature_importances"]
    factor_reasons = []
    if factors.get("slope_deg", 0) > 30:
        factor_reasons.append(f"Steep slope gradient ({factors.get('slope_deg')}°)")
    if factors.get("dist_to_fault_m", 1000) < 500:
        factor_reasons.append(f"Immediate proximity to active tectonic lineament ({factors.get('dist_to_fault_m')}m)")
    if factors.get("ndvi", 1.0) < 0.4:
        factor_reasons.append(f"Low vegetation shielding / exposed scarp (NDVI {factors.get('ndvi')})")
    if factors.get("dist_to_drainage_m", 1000) < 100:
        factor_reasons.append(f"Stream-toe hydraulic scouring zone ({factors.get('dist_to_drainage_m')}m)")
    if factors.get("base_rainfall_mm", 0) > 60:
        factor_reasons.append(f"High antecedent saturation baseline ({factors.get('base_rainfall_mm')}mm)")

    if not factor_reasons:
        factor_reasons.append("Stable terrain morphology, low slope, and adequate vegetative cover.")

    res = {
        "class_index": pred_idx,
        "class_name": CLASS_NAMES[pred_idx],
        "static_risk_score": round(continuous_score, 3),
        "class_probabilities": {CLASS_NAMES[i]: round(probs[i], 4) for i in range(len(CLASS_NAMES))},
        "top_drivers": factor_reasons[:3],
        "feature_importances": importances
    }
    if seg_id:
        _STATIC_CACHE[seg_id] = res

    return res


if __name__ == "__main__":
    train_and_save_model()

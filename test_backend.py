"""
Verification test script for Setumarg backend endpoints.
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def run_tests():
    print("=== Testing Setumarg Backend ===")

    # 1. Root health check
    res = client.get("/")
    assert res.status_code == 200
    print(" Root health check:", res.json()["status"])

    # 2. Risk segments (Default Page Load = Live Weather + Historical Disruption Predictions)
    res = client.get("/api/risk/segments")
    assert res.status_code == 200
    data = res.json()
    assert data["is_live_mode"] is True
    assert data["current_scenario"] == "live_weather"
    first_seg = data["segments"][0]
    assert "disruption_likelihood_pct" in first_seg
    assert "disruption_prediction_text" in first_seg
    print(f" Risk segments: {len(data['segments'])} segments monitored, Live Mode={data['is_live_mode']}, Scenario={data['current_scenario']}, Tiers: {data['tier_summary']}")

    # 3. Risk segment detail with Historical Failure Pattern
    seg_id = data["segments"][0]["segment_id"]
    res = client.get(f"/api/risk/segment/{seg_id}")
    assert res.status_code == 200
    seg_detail = res.json()
    assert seg_detail.get("live_weather", {}).get("is_live") is True
    assert "historical_incident_profile" in seg_detail
    assert "historical_threshold_mm_24h" in seg_detail["historical_incident_profile"]
    print(f" Risk detail for {seg_id}: {seg_detail['dynamic_alert_tier']}, Disruption={seg_detail['disruption_likelihood_pct']}%, Prediction='{seg_detail['disruption_prediction_text']}'")

    # 4. Scenarios & Nowcast update
    res = client.post("/api/risk/nowcast", json={"scenario_key": "cloudburst_extreme"})
    assert res.status_code == 200
    print(" Nowcast extreme scenario updated, Severe count:", res.json()["tier_summary"]["Severe"])

    # 5. Accessibility villages
    res = client.get("/api/accessibility/villages")
    assert res.status_code == 200
    v_data = res.json()
    print(f" Accessibility: {len(v_data['villages'])} villages, Isolated: {v_data['summary']['currently_isolated_villages']}, RAI: {v_data['summary']['rural_access_index_percent']}%")

    # 6. Route optimizer (Propagated Live Meteorological Evaluation)
    res = client.post("/api/routing/optimize", json={"origin": "Guwahati", "destination": "Silchar", "vehicle_type": "heavy_truck"})
    assert res.status_code == 200
    r_data = res.json()
    assert "is_live_weather_mode" in r_data
    assert "naive_disruption_likelihood_pct" in r_data["summary_comparison"]
    print(f" Route optimizer: Recommendation={r_data['ai_recommendation']}, Extra distance={r_data['summary_comparison']['extra_distance_km']}km, Hours saved={r_data['summary_comparison']['hours_saved_against_stranding']}h, Impending Naive Disruption={r_data['summary_comparison']['naive_disruption_likelihood_pct']}%")

    # 7. Freight planner
    res = client.post("/api/freight/plan", json={"origin_hub_id": "HUB-SIL-01", "destination_hub_id": "HUB-DBR-01", "cargo_weight_tons": 25.0})
    assert res.status_code == 200
    f_data = res.json()
    print(f" Freight planner: Best mode='{f_data['optimal_mode']}', GatiShakti Contract={f_data['ulip_gatishakti_contract']['consignment_id']}")

    # 8. Crowdsourced report
    res = client.post("/api/reports", json={
        "lat": 25.1098,
        "lng": 92.3987,
        "hazard_type": "Rockfall",
        "severity": "Critical",
        "description": "Boulders on carriageway after early morning downpour."
    })
    assert res.status_code == 200
    print(" Hazard report submitted:", res.json()["report"]["id"])

    # 9. Dashboard stats
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    d_data = res.json()
    assert "is_live_mode" in d_data
    print(" Dashboard KPIs: Economic savings Rs.", d_data["pillar_economic"]["estimated_monthly_freight_savings_cr"], "Cr, Strategic alert:", d_data["pillar_strategic"]["nowcast_alert_level"])

    # 10. Live weather ingestion (Open-Meteo)
    res = client.get("/api/risk/live-weather")
    assert res.status_code == 200
    w_data = res.json()
    assert "summary" in w_data and "districts" in w_data
    print(f" Live Weather Ingestion: Status={w_data['summary']['status']}, Source='{w_data['summary']['source']}', Monitored Districts={w_data['summary']['active_districts_count']}")

    # 11. Scheduled / on-demand recompute trigger
    res = client.post("/api/risk/recompute")
    assert res.status_code == 200
    rec_data = res.json()
    assert rec_data["status"] == "RECOMPUTED"
    print(f" Scheduled Risk Recompute: Status={rec_data['status']}, Timestamp={rec_data['timestamp']}")

    # 12. Live status polling endpoint
    res = client.get("/api/risk/live-status")
    assert res.status_code == 200
    ls_data = res.json()
    assert "is_live_mode" in ls_data
    assert "last_recompute_time" in ls_data
    print(f" Live Status Polling: Mode={ls_data['is_live_mode']}, Scenario={ls_data['active_scenario_key']}, RecomputeTime={ls_data['last_recompute_time']}")

    print("=== All Backend Tests Passed Successfully! ===")


if __name__ == "__main__":
    run_tests()

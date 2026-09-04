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

    # 2. Risk segments
    res = client.get("/api/risk/segments")
    assert res.status_code == 200
    data = res.json()
    print(f" Risk segments: {len(data['segments'])} segments monitored, Tiers: {data['tier_summary']}")

    # 3. Risk segment detail
    seg_id = data["segments"][0]["segment_id"]
    res = client.get(f"/api/risk/segment/{seg_id}")
    assert res.status_code == 200
    print(f" Risk detail for {seg_id}: {res.json()['dynamic_alert_tier']}, top drivers: {res.json()['top_drivers']}")

    # 4. Scenarios & Nowcast update
    res = client.post("/api/risk/nowcast", json={"scenario_key": "cloudburst_extreme"})
    assert res.status_code == 200
    print(" Nowcast extreme scenario updated, Severe count:", res.json()["tier_summary"]["Severe"])

    # 5. Accessibility villages
    res = client.get("/api/accessibility/villages")
    assert res.status_code == 200
    v_data = res.json()
    print(f" Accessibility: {len(v_data['villages'])} villages, Isolated: {v_data['summary']['currently_isolated_villages']}, RAI: {v_data['summary']['rural_access_index_percent']}%")

    # 6. Route optimizer
    res = client.post("/api/routing/optimize", json={"origin": "Guwahati", "destination": "Silchar", "vehicle_type": "heavy_truck"})
    assert res.status_code == 200
    r_data = res.json()
    print(f" Route optimizer: Recommendation={r_data['ai_recommendation']}, Extra distance={r_data['summary_comparison']['extra_distance_km']}km, Hours saved={r_data['summary_comparison']['hours_saved_against_stranding']}h")

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
    print(" Dashboard KPIs: Economic savings Rs.", d_data["pillar_economic"]["estimated_monthly_freight_savings_cr"], "Cr, Strategic alert:", d_data["pillar_strategic"]["nowcast_alert_level"])

    print("=== All Backend Tests Passed Successfully! ===")


if __name__ == "__main__":
    run_tests()

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

    # 5. Accessibility villages (Real-time weather, RAI, Airlift Evacuation Triage)
    res = client.get("/api/accessibility/villages")
    assert res.status_code == 200
    v_data = res.json()
    assert "regional_emergency_status" in v_data["summary"]
    assert "airlift_required_villages_count" in v_data["summary"]
    assert "live_rain_mm" in v_data["villages"][0]
    print(f" Accessibility: {len(v_data['villages'])} villages, Isolated: {v_data['summary']['currently_isolated_villages']}, Status={v_data['summary']['regional_emergency_status']}, RAI: {v_data['summary']['rural_access_index_percent']}%")

    # 6. Route optimizer (5 Corridors, Live Weather Ingestion & Delay Attribution)
    res_pairs = client.get("/api/routing/available-pairs")
    assert res_pairs.status_code == 200
    assert len(res_pairs.json()) >= 5
    print(f" Available Corridors: {len(res_pairs.json())} routes configured across NER")

    res = client.post("/api/routing/optimize", json={"origin": "Guwahati", "destination": "Silchar", "vehicle_type": "heavy_truck"})
    assert res.status_code == 200
    r_data = res.json()
    assert "is_live_weather_mode" in r_data
    assert "corridor_weather" in r_data
    assert "origin" in r_data["corridor_weather"]
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
    # 13. Fleet Tracking & Telematics (PS26002 GPS Fleet Simulation)
    res = client.get("/api/fleet/vehicles")
    assert res.status_code == 200
    fl_data = res.json()
    assert "summary" in fl_data
    assert "vehicles" in fl_data
    assert fl_data["summary"]["total_vehicles"] >= 5
    v1 = fl_data["vehicles"][0]
    assert "id" in v1
    assert "cargo_type" in v1
    assert "cargo_category" in v1
    assert "current_lat" in v1 and "current_lng" in v1
    assert "lat" in v1 and "lng" in v1
    assert "assigned_route" in v1 or "route" in v1
    assert "status" in v1 and v1["status"] in ["moving", "delayed", "stranded"]
    assert "eta_minutes" in v1 or "eta" in v1
    print(f" Fleet Tracking: {fl_data['summary']['total_vehicles']} vehicles, Moving={fl_data['summary']['moving']}, Delayed={fl_data['summary']['delayed']}, Stranded={fl_data['summary']['stranded']}")
    print(f" Sample Vehicle: id={v1['id']}, cargo={v1['cargo_type']}, route={v1.get('assigned_route')}, status={v1['status']}, eta={v1.get('eta')}")

    # Single vehicle query & tick advance
    res_adv = client.post("/api/fleet/advance")
    assert res_adv.status_code == 200
    res_single = client.get(f"/api/fleet/vehicles/{v1['id']}")
    assert res_single.status_code == 200
    assert res_single.json()["id"] == v1["id"]

    # 14. Logistics Bottlenecks & Delivery Status Dashboard (PS26002 point g)
    res_b = client.get("/api/fleet/bottlenecks")
    assert res_b.status_code == 200
    b_data = res_b.json()
    assert "summary" in b_data
    assert "bottlenecks" in b_data
    print(f" Logistics Bottlenecks: {b_data['summary']['total_bottlenecks_identified']} identified, Critical={b_data['summary']['critical_bottlenecks_count']}")

    # 15. Traffic Congestion & Delay Attribution (PS26002 point b)
    # Check risk segment contains congestion fields
    assert "congestion_index" in first_seg
    assert "congestion_tier" in first_seg
    assert "congestion_delay_min" in first_seg
    assert "delay_attribution" in first_seg
    assert "primary_delay_cause" in first_seg["delay_attribution"]
    print(f" Traffic Congestion in Segment 0: index={first_seg['congestion_index']}, tier={first_seg['congestion_tier']}, primary_delay_cause={first_seg['delay_attribution']['primary_delay_cause']}")

    # Check routing comparison contains distinct delay breakdown
    naive_route = r_data["naive_route"]
    assert "hazard_delay_hrs" in naive_route
    assert "congestion_delay_hrs" in naive_route
    assert "primary_cause" in naive_route
    assert "congestion_delay_saved_hrs" in r_data["summary_comparison"]
    assert "primary_bottleneck_driver" in r_data["summary_comparison"]
    print(f" Route Delay Attribution: Naive hazard={naive_route['hazard_delay_hrs']}h, congestion={naive_route['congestion_delay_hrs']}h, cause={naive_route['primary_cause']}")

    # 16. Multilingual Emergency Alerts & SMS/IVR Templates (PS26002 point h)
    # Check alert templates endpoint for Assamese, Hindi, Bengali
    res_as = client.get(f"/api/accessibility/alert-templates?village_id={v_data['villages'][0]['id']}&language=as")
    assert res_as.status_code == 200
    tmpl_as = res_as.json()
    assert tmpl_as["language"] == "as"
    assert "সতৰ্কবাৰ্তা" in tmpl_as["message"]
    assert "hi" in tmpl_as["all_translations"]
    assert "bn" in tmpl_as["all_translations"]

    # Trigger multilingual SMS broadcast
    res_sms_hi = client.post("/api/accessibility/trigger-sms-ivr", json={
        "village_id": v_data['villages'][0]['id'],
        "language": "hi"
    })
    assert res_sms_hi.status_code == 200
    disp_hi = res_sms_hi.json()["dispatch"]
    assert disp_hi["language"] == "hi"
    assert "सेतुमार्ग आपातकालीन चेतावनी" in disp_hi["message"]
    print(f" Multilingual SMS/IVR Dispatch: Sent {disp_hi['dispatch_id']} in '{disp_hi['language']}' for village {disp_hi['village_name']}")

    # 17. Offline Data Sync for Field Reporting (PS26002 point h / offline support)
    offline_payload = {
        "reports": [
            {
                "lat": 25.1098,
                "lng": 92.3987,
                "hazard_type": "Debris Flow / Mudslide",
                "severity": "Critical",
                "description": "Queued offline report from BRO field patrol during cellular blackout.",
                "reported_by": "BRO Field Unit (Offline Sync)"
            }
        ]
    }
    res_sync = client.post("/api/reports/sync-offline", json=offline_payload)
    assert res_sync.status_code == 200
    sync_data = res_sync.json()
    assert sync_data["status"] == "SYNC_SUCCESSFUL"
    assert sync_data["synced_count"] == 1
    assert sync_data["synced_reports"][0]["reported_by"] == "BRO Field Unit (Offline Sync)"
    # 18. Live District Weather Telemetry (Spatial Rain Status)
    res_dist = client.get("/api/risk/weather/districts")
    assert res_dist.status_code == 200
    dist_data = res_dist.json()
    assert dist_data["status"] in ["LIVE_SYNCHRONIZED", "CACHED_FALLBACK", "CALIBRATED_BASELINE", "OK"]
    assert dist_data["districts_count"] >= 30
    first_dist = dist_data["districts"][0]
    assert "district" in first_dist
    assert "current_rain_mm" in first_dist
    assert "forecast_next_24h_mm" in first_dist
    print(f" District Weather Telemetry: {dist_data['districts_count']} districts, Sample={first_dist['district']} ({first_dist['current_rain_mm']} mm/hr)")

    # 19. GSI Bhukosh Historical Landslide Inventory Layer
    res_gsi = client.get("/api/risk/historical-landslides")
    assert res_gsi.status_code == 200
    gsi_data = res_gsi.json()
    assert gsi_data["status"] == "OK"
    assert gsi_data["total_incidents"] >= 50
    first_gsi = gsi_data["incidents"][0]
    assert "gsi_bhukosh_id" in first_gsi
    assert "name" in first_gsi
    assert "trigger_rainfall_mm_24h" in first_gsi
    assert "road_closure_days" in first_gsi
    print(f" GSI Bhukosh Historical Landslides: {gsi_data['total_incidents']} verified records, Sample={first_gsi['name']} ({first_gsi['gsi_bhukosh_id']})")

    # Verify that segment detail returns soil_profile and GSI calibration
    res_seg = client.get("/api/risk/segment/SEG-NH-6-NH-44-01")
    assert res_seg.status_code == 200
    seg_detail = res_seg.json()
    assert "soil_profile" in seg_detail
    assert "clay_pct" in seg_detail["soil_profile"]
    assert "historical_incident_profile" in seg_detail
    print(f" Segment Geotechnical & History Profile: Soil={seg_detail['soil_profile']['texture_name']}, Disruption={seg_detail['dynamic_alert_tier']} ({seg_detail['disruption_likelihood_pct']}%)")

    print("=== All Backend Tests Passed Successfully! ===")



if __name__ == "__main__":
    run_tests()

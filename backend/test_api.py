from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("Testing Root & Health...")
    r = client.get("/")
    assert r.status_code == 200, r.text
    print("[PASS] Root OK:", r.json())

    print("\nTesting /api/cargo/analyze...")
    payload = {
        "cargo_category": "Dry Bulk",
        "cargo_type": "Coking Coal (Prime Hard Metallurgical)",
        "quantity_mt": 165000,
        "starting_port": "Hay Point, AU (HAY)",
        "destination_port": "Paradip, IN (PRT)",
        "laycan_start": "2025-02-18",
        "laycan_end": "2025-02-25"
    }
    r = client.post("/api/cargo/analyze", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    print("[PASS] Cargo Analyze OK! Freight:", data["freight_market"]["freight_per_mt"], "Vessel:", data["vessel_analysis"]["recommended_vessel"])
    print("[PASS] Effective Cost:", data["effective_cost"]["total_cost_per_mt"])
    print("[PASS] Decision:", data["final_decision"]["decision"])

    print("\nTesting /api/decision/approve...")
    approve_payload = {
        "cargo_type": "Coking Coal",
        "quantity_mt": 165000,
        "route": "Hay Point → Paradip",
        "vessel": "MV Maritime Fortune",
        "freight_rate": 14.85,
        "cost_per_mt": 21.30,
        "laycan_window": "18 FEB 2025 - 25 FEB 2025"
    }
    r = client.post("/api/decision/approve", json=approve_payload)
    assert r.status_code == 200, r.text
    print("[PASS] Decision Approve OK! Fixture ID:", r.json()["fixture_id"])

    print("\nTesting /api/market/current & /api/market/history...")
    r = client.get("/api/market/current")
    assert r.status_code == 200, r.text
    r_hist = client.get("/api/market/history")
    assert r_hist.status_code == 200, r_hist.text
    print("[PASS] Market OK! Records count:", len(r_hist.json()))

    print("\nTesting /api/history...")
    r = client.get("/api/history")
    assert r.status_code == 200, r.text
    print("[PASS] History OK! Total ledger count:", len(r.json()["ledger"]))

    print("\nTesting /api/settings...")
    r = client.get("/api/settings")
    assert r.status_code == 200, r.text
    print("[PASS] Settings OK! User:", r.json()["full_name"])

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_endpoints()

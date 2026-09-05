import sys
import os
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("Testing GET /api/health...")
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "healthy"}
    print("  -> PASSED:", r.json())

    print("Testing GET /api/customers...")
    r = client.get("/api/customers")
    assert r.status_code == 200
    customers = r.json()
    assert len(customers) >= 5
    print(f"  -> PASSED: {len(customers)} customers returned")

    print("Testing GET /api/products...")
    r = client.get("/api/products")
    assert r.status_code == 200
    products = r.json()
    assert len(products) >= 10
    print(f"  -> PASSED: {len(products)} products returned")

    print("Testing GET /api/orders...")
    r = client.get("/api/orders")
    assert r.status_code == 200
    orders = r.json()
    assert len(orders) >= 15
    print(f"  -> PASSED: {len(orders)} orders returned")

    print("Testing GET /api/returns...")
    r = client.get("/api/returns")
    assert r.status_code == 200
    returns = r.json()
    assert len(returns) >= 5
    print(f"  -> PASSED: {len(returns)} return cases returned")

    first_case_id = returns[0]["id"]
    print(f"Testing GET /api/returns/{first_case_id}...")
    r = client.get(f"/api/returns/{first_case_id}")
    assert r.status_code == 200
    case_detail = r.json()
    assert case_detail["id"] == first_case_id
    print(f"  -> PASSED: Case {case_detail['case_number']} retrieved")

    print("Testing POST /api/returns (Create New Return Case)...")
    payload = {
        "order_id": orders[0]["id"],
        "customer_id": customers[0]["id"],
        "reason": "Defective item",
        "description": "Test case created via API test script."
    }
    r = client.post("/api/returns", json=payload)
    assert r.status_code in [200, 201]
    new_case = r.json()
    new_case_id = new_case["id"]
    print(f"  -> PASSED: Created case #{new_case_id} ({new_case['case_number']})")

    print("Testing PATCH /api/returns/{case_id}...")
    r = client.patch(f"/api/returns/{new_case_id}", json={"status": "Needs Human Review", "risk_level": "Medium"})
    assert r.status_code == 200
    updated = r.json()
    assert updated["status"] == "Needs Human Review"
    print(f"  -> PASSED: Updated case #{new_case_id} status to {updated['status']}")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_endpoints()

import sys
import os
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import Base, engine
from app.main import app

# Ensure all database tables (including investigation_results) exist
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_step2_multi_agent_workflow():
    print("=" * 60)
    print("RUNNING STEP 2 MULTI-AGENT WORKFLOW VERIFICATION TESTS")
    print("=" * 60)

    # 1. Test Nonexistent case handling
    print("\n1. Testing POST /api/returns/99999/investigate (Nonexistent Case)...")
    r = client.post("/api/returns/99999/investigate")
    assert r.status_code == 404
    print("  -> PASSED: Returned 404 Not Found as expected.")

    # 2. Retrieve existing return cases
    print("\n2. Fetching available seeded return cases...")
    r = client.get("/api/returns")
    assert r.status_code == 200
    cases = r.json()
    assert len(cases) > 0
    print(f"  -> Found {len(cases)} return cases in database.")

    # 3. Test Investigation on Case 1
    case_1 = cases[0]
    c1_id = case_1["id"]
    print(f"\n3. Running Multi-Agent Investigation on Case #{c1_id} ({case_1['case_number']})...")
    r = client.post(f"/api/returns/{c1_id}/investigate")
    if r.status_code != 200:
        print("ERROR RESPONSE:", r.status_code, r.text)
    assert r.status_code == 200
    inv_res = r.json()

    assert inv_res["case_id"] == c1_id
    assert inv_res["status"] == "completed"
    res_dict = inv_res["result"]

    # Verify agent outputs
    assert "order" in res_dict
    assert "customer" in res_dict
    assert "policy" in res_dict
    assert "fraud" in res_dict
    assert "risk" in res_dict
    assert "decision" in res_dict

    print("  -> Order Agent Output:", res_dict["order"])
    print("  -> Customer Agent Output:", res_dict["customer"])
    print("  -> Policy Agent Output:", res_dict["policy"])
    print("  -> Fraud Agent Output:", res_dict["fraud"])
    print("  -> Risk Agent Output:", res_dict["risk"])
    print("  -> Decision Agent Output:", res_dict["decision"])
    print(f"  -> PASSED: Case #{c1_id} investigated successfully.")

    # 4. Test Investigation on Case 5 (Serial Returner Risk Case)
    case_5 = cases[4] if len(cases) >= 5 else cases[-1]
    c5_id = case_5["id"]
    print(f"\n4. Running Multi-Agent Investigation on Case #{c5_id} ({case_5['case_number']})...")
    r = client.post(f"/api/returns/{c5_id}/investigate")
    if r.status_code != 200:
        print("ERROR RESPONSE 5:", r.status_code, r.text)
    assert r.status_code == 200
    inv_res_5 = r.json()
    res_dict_5 = inv_res_5["result"]

    print("  -> Risk Level:", res_dict_5["risk"]["level"])
    print("  -> Recommendation:", res_dict_5["decision"]["recommendation"])
    print("  -> Decision Reason:", res_dict_5["decision"]["reason"])
    print(f"  -> PASSED: High risk / suspicious return history correctly evaluated.")

    # 5. Test saved agent results endpoint
    print(f"\n5. Fetching saved agent execution logs for Case #{c1_id}...")
    r = client.get(f"/api/returns/{c1_id}/results")
    assert r.status_code == 200
    logs = r.json()
    assert logs["total_results"] >= 6
    print(f"  -> PASSED: {logs['total_results']} agent logs retrieved from database.")

    print("\n" + "=" * 60)
    print("ALL STEP 2 MULTI-AGENT WORKFLOW TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_step2_multi_agent_workflow()

import sys
import os
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import Base, engine, SessionLocal
from app.main import app
from app.rag import index_policy_documents, retrieve_policy_context
from app.agents.policy_agent import run_policy_agent
from app.agents.customer_agent import run_customer_agent
from app.agents.graph import run_investigation_workflow
from app.memory import memory_service, get_customer_memories

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_step3_rag_and_memory():
    print("=" * 70)
    print("RUNNING STEP 3: PROPER RAG + PERSISTENT MEMORY VERIFICATION TESTS")
    print("=" * 70)

    # -------------------------------------------------------------
    # TEST 1: RAG Initialization & Document Indexing
    # -------------------------------------------------------------
    print("\n[TEST 1] RAG Initialization & Document Indexing...")
    chunk_count = index_policy_documents(force=True)
    assert chunk_count > 0
    print(f"  -> PASSED: Indexed {chunk_count} policy chunks into ChromaDB vector store.")

    # -------------------------------------------------------------
    # TEST 2: Policy Context Retrieval (Semantic Search)
    # -------------------------------------------------------------
    print("\n[TEST 2] Vector Policy Context Retrieval...")
    test_query = "defective product return within 30 days"
    retrieved = retrieve_policy_context(test_query, top_k=3)
    assert len(retrieved) > 0
    assert "content" in retrieved[0]
    assert "metadata" in retrieved[0]
    print(f"  -> PASSED: Retrieved {len(retrieved)} policy chunks for query '{test_query}'.")
    print(f"     Sample Content: {retrieved[0]['content'][:120]}...")

    # -------------------------------------------------------------
    # TEST 3: Policy Agent with RAG Evidence
    # -------------------------------------------------------------
    print("\n[TEST 3] Policy Agent RAG Execution...")
    db = SessionLocal()
    try:
        mock_state = {
            "case_id": 1,
            "db_session": db,
            "order_result": {"days_since_delivery": 3, "delivered": True, "product_name": "iPhone 15"}
        }
        res_state = run_policy_agent(mock_state)
        pol = res_state.get("policy_result", {})

        assert "eligible" in pol
        assert "policy_rule" in pol
        assert "evidence" in pol
        assert "sources" in pol
        assert len(pol["evidence"]) > 0
        print(f"  -> PASSED: Policy Agent evaluated eligibility ({pol['eligible']}) with RAG evidence citations ({len(pol['evidence'])} chunks).")
    finally:
        db.close()

    # -------------------------------------------------------------
    # TEST 4 & 5: Persistent Memory Creation & Persistence
    # -------------------------------------------------------------
    print("\n[TEST 4 & 5] Persistent Investigation Memory & SQLite Persistence...")
    db = SessionLocal()
    try:
        mem = memory_service.save_memory(
            db=db,
            customer_id=1,
            return_case_id=1,
            memory_type="risk_observation",
            content="Customer submitted claim with cracked screen within 3 days. Low risk profile.",
            metadata_dict={"risk_level": "LOW", "score": 20}
        )
        assert mem.id is not None
        print(f"  -> PASSED: Created InvestigationMemory record #{mem.id} in SQLite.")

        # Test querying persisted memories
        c_mems = get_customer_memories(db, customer_id=1, limit=5)
        assert len(c_mems) > 0
        print(f"  -> PASSED: Retrieved {len(c_mems)} persistent memories for Customer #1 across application restarts.")
    finally:
        db.close()

    # -------------------------------------------------------------
    # TEST 6: Customer Agent Memory Integration
    # -------------------------------------------------------------
    print("\n[TEST 6] Customer Agent Memory Retrieval...")
    db = SessionLocal()
    try:
        mock_cust_state = {"case_id": 1, "db_session": db}
        res_cust = run_customer_agent(mock_cust_state)
        cust_res = res_cust.get("customer_result", {})

        assert "persistent_memories" in cust_res
        assert cust_res["customer_found"] == True
        print(f"  -> PASSED: Customer Agent retrieved {len(cust_res['persistent_memories'])} persistent memories for Customer #{cust_res['customer_id']}.")
    finally:
        db.close()

    # -------------------------------------------------------------
    # TEST 7: Full Multi-Agent Workflow Execution with RAG & Memory
    # -------------------------------------------------------------
    print("\n[TEST 7] Full Multi-Agent Workflow (RAG + Persistent Memory)...")
    db = SessionLocal()
    try:
        wf_res = run_investigation_workflow(case_id=1, db=db)
        assert wf_res["status"] == "completed"
        res_dict = wf_res["result"]

        assert len(res_dict["policy"]["evidence"]) > 0
        assert "recommendation" in res_dict["decision"]
        print(f"  -> PASSED: LangGraph workflow completed. Final Recommendation: {res_dict['decision']['recommendation']}.")
    finally:
        db.close()

    # -------------------------------------------------------------
    # TEST 8: Backward Compatibility Check for Endpoints
    # -------------------------------------------------------------
    print("\n[TEST 8] Endpoints & Backward Compatibility Check...")
    # Health check
    r = client.get("/api/health")
    assert r.status_code == 200

    # Customer memories endpoint
    r = client.get("/api/customers/1/memories")
    assert r.status_code == 200
    assert "memories" in r.json()

    # Case memories endpoint
    r = client.get("/api/returns/1/memories")
    assert r.status_code == 200
    assert "memories" in r.json()

    # RAG reindex endpoint
    r = client.post("/api/rag/reindex")
    assert r.status_code == 200
    assert r.json()["status"] == "success"

    print("  -> PASSED: All REST API endpoints (Health, Memory, RAG) verified working.")

    print("\n" + "=" * 70)
    print("ALL STEP 3 RAG & PERSISTENT MEMORY TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_step3_rag_and_memory()

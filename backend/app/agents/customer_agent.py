import logging
from datetime import datetime, timedelta
from app.services import investigation_service
from app.memory import memory_service
from app.agents.state import InvestigationState

logger = logging.getLogger("returnshield.agents.customer")

def run_customer_agent(state: InvestigationState) -> InvestigationState:
    """
    Upgraded Step 3 Customer Agent Node Function.
    Retrieves customer database history AND fetches long-term persistent investigation memories
    from SQLite to evaluate historical patterns across past claims.
    """
    case_id = state.get("case_id")
    db = state.get("db_session")
    logger.info(f"[CUSTOMER AGENT (MEMORY)] Running customer profile & memory scan for case_id={case_id}")

    try:
        case = investigation_service.get_return_case(db, case_id) if db and case_id else None
        if not case or not case.customer_id:
            state["customer_result"] = {
                "customer_found": False,
                "total_orders": 0,
                "previous_returns": 0,
                "return_ratio": 0.0,
                "recent_returns": 0,
                "persistent_memories": []
            }
            return state

        # 1. Fetch DB History
        history = investigation_service.get_customer_history(db, case.customer_id)
        if not history or not history.get("customer"):
            state["customer_result"] = {
                "customer_found": False,
                "total_orders": 0,
                "previous_returns": 0,
                "return_ratio": 0.0,
                "recent_returns": 0,
                "persistent_memories": []
            }
            return state

        customer = history["customer"]
        orders = history.get("orders", [])
        return_cases = history.get("return_cases", [])

        total_orders = len(orders)
        previous_returns = len(return_cases)
        return_ratio = round(previous_returns / max(total_orders, 1), 3)

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_returns = sum(1 for r in return_cases if r.created_at >= thirty_days_ago)

        # 2. Fetch Persistent Customer Memories
        memories = memory_service.get_customer_memories(db, customer.id, limit=5)
        parsed_memories = []
        high_risk_memory_count = 0

        for m in memories:
            mem_item = {
                "id": m.id,
                "case_id": m.return_case_id,
                "memory_type": m.memory_type,
                "content": m.content,
                "created_at": m.created_at.isoformat()
            }
            parsed_memories.append(mem_item)
            if "HIGH" in m.content or "Risk score" in m.content:
                high_risk_memory_count += 1

        state["customer_memories"] = parsed_memories
        state["memory_context"] = f"Customer has {len(parsed_memories)} historical investigation memories. High risk flags: {high_risk_memory_count}."

        customer_result = {
            "customer_found": True,
            "customer_id": customer.id,
            "customer_name": customer.name,
            "customer_email": customer.email,
            "total_orders": total_orders,
            "total_spent": float(history.get("total_spent", 0.0)),
            "previous_returns": previous_returns,
            "return_ratio": return_ratio,
            "recent_returns": recent_returns,
            "persistent_memories": parsed_memories,
            "persistent_memory_count": len(parsed_memories),
            "historical_risk_flags": high_risk_memory_count
        }

        state["customer_data"] = customer_result
        state["customer_result"] = customer_result
        logger.info(f"[CUSTOMER AGENT (MEMORY)] Customer analysis complete: {customer.name}, ratio={return_ratio}, memories_found={len(parsed_memories)}")

    except Exception as e:
        logger.error(f"[CUSTOMER AGENT (MEMORY)] Error during execution: {e}")
        state.setdefault("errors", []).append(f"CustomerAgent error: {str(e)}")
        state["customer_result"] = {
            "customer_found": False,
            "error": str(e),
            "persistent_memories": []
        }

    return state

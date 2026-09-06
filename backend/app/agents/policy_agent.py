import logging
from typing import List, Dict, Any
from app.services import investigation_service
from app.agents.state import InvestigationState
from app.rag.retriever import retrieve_policy_context

logger = logging.getLogger("returnshield.agents.policy")

def run_policy_agent(state: InvestigationState) -> InvestigationState:
    """
    Upgraded Step 3 Policy Agent Node Function.
    Generates a targeted query from the return case, retrieves relevant policy chunks
    from the ChromaDB vector store (RAG), and evaluates claim eligibility against retrieved policy evidence.
    """
    case_id = state.get("case_id")
    db = state.get("db_session")
    order_res = state.get("order_result", {})
    logger.info(f"[POLICY AGENT (RAG)] Evaluating policy compliance using ChromaDB vector retrieval for case_id={case_id}")

    try:
        case = investigation_service.get_return_case(db, case_id) if db and case_id else None
        if not case:
            state["policy_result"] = {
                "eligible": False,
                "policy_rule": "Standard Policy",
                "evidence": [],
                "sources": [],
                "reason": "Return case record not found"
            }
            return state

        days_since_delivery = order_res.get("days_since_delivery")
        is_delivered = order_res.get("delivered", False)
        claim_reason = case.reason
        product_name = order_res.get("product_name", "item")
        evidence_list = case.evidence_list or []
        evidence_provided = len(evidence_list) > 0

        # 1. Build targeted RAG retrieval query
        query_str = f"Return policy for {claim_reason} on {product_name} delivered {days_since_delivery or 'recently'} days ago"
        logger.info(f"[POLICY AGENT (RAG)] Formulated RAG query: '{query_str}'")

        # 2. Retrieve relevant policy chunks from ChromaDB
        retrieved_chunks = retrieve_policy_context(query_str, top_k=4)

        state["retrieved_policy_context"] = retrieved_chunks
        evidence_texts = [chunk["content"] for chunk in retrieved_chunks]
        sources = list(set([chunk["metadata"].get("source", "return_policy.md") for chunk in retrieved_chunks]))
        state["policy_sources"] = sources

        # 3. Policy Rule Evaluation Logic
        max_days = 14
        policy_rule_desc = "Standard 14-Day Return Policy"
        evidence_required = False

        if "Damaged" in claim_reason or "Missing" in claim_reason:
            max_days = 7
            policy_rule_desc = "Damaged products must be reported within 7 days of delivery."
            evidence_required = True
        elif "Defective" in claim_reason or "Faulty" in claim_reason:
            max_days = 30
            policy_rule_desc = "Defective items are eligible within 30 days under warranty."
            evidence_required = True
        elif "Wrong item" in claim_reason or "Remorse" in claim_reason:
            max_days = 14
            policy_rule_desc = "Wrong item / Unopened returns eligible within 14 days."

        # 4. Eligibility determination
        if not is_delivered:
            eligible = True
            reason_msg = f"Order status '{order_res.get('order_status', 'In Transit')}' is prior to delivery confirmation. Eligible for cancellation/return."
        elif days_since_delivery is None:
            eligible = True
            reason_msg = "Delivery timestamp unconfirmed. Defaulting to policy inspection."
        elif days_since_delivery <= max_days:
            eligible = True
            reason_msg = f"Claim submitted {days_since_delivery} day(s) after delivery (within allowed {max_days}-day policy window)."
        else:
            eligible = False
            reason_msg = f"Claim submitted {days_since_delivery} day(s) after delivery, exceeding the maximum allowed {max_days}-day limit."

        if evidence_required and not evidence_provided:
            reason_msg += " Note: Evidence photo is recommended for damage/defective claims."

        policy_result = {
            "eligible": eligible,
            "policy_rule": policy_rule_desc,
            "max_allowed_days": max_days,
            "days_elapsed": days_since_delivery,
            "reason": reason_msg,
            "evidence_required": evidence_required,
            "evidence_provided": evidence_provided,
            "query_used": query_str,
            "retrieved_chunks_count": len(retrieved_chunks),
            "evidence": evidence_texts,
            "sources": sources,
            "knowledge_source": "ChromaDB Vector Store (Step 3 RAG Pipeline)"
        }

        state["policy_result"] = policy_result
        logger.info(f"[POLICY AGENT (RAG)] Evaluation complete: eligible={eligible}, retrieved_chunks={len(retrieved_chunks)}")

    except Exception as e:
        logger.error(f"[POLICY AGENT (RAG)] Error during execution: {e}")
        state.setdefault("errors", []).append(f"PolicyAgent error: {str(e)}")
        state["policy_result"] = {
            "eligible": False,
            "policy_rule": "Fallback Policy",
            "evidence": [],
            "sources": ["return_policy.md"],
            "reason": f"RAG execution error: {str(e)}"
        }

    return state

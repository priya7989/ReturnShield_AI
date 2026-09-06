import logging
from typing import Dict, Any
from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, START, END

from app.agents.state import InvestigationState
from app.agents.order_agent import run_order_agent
from app.agents.customer_agent import run_customer_agent
from app.agents.policy_agent import run_policy_agent
from app.agents.fraud_agent import run_fraud_agent
from app.agents.risk_agent import run_risk_agent
from app.agents.decision_agent import run_decision_agent
from app.services import investigation_service
from app.memory import memory_service

logger = logging.getLogger("returnshield.agents.graph")


def build_investigation_graph():
    """
    Constructs the LangGraph StateGraph workflow for ReturnShield AI multi-agent investigation.
    Pipeline: OrderAgent -> CustomerAgent -> PolicyAgent -> FraudAgent -> RiskAgent -> DecisionAgent.
    """
    workflow = StateGraph(InvestigationState)

    # Define Node Functions
    workflow.add_node("order_agent", run_order_agent)
    workflow.add_node("customer_agent", run_customer_agent)
    workflow.add_node("policy_agent", run_policy_agent)
    workflow.add_node("fraud_agent", run_fraud_agent)
    workflow.add_node("risk_agent", run_risk_agent)
    workflow.add_node("decision_agent", run_decision_agent)

    # Define Sequential Edges
    workflow.add_edge(START, "order_agent")
    workflow.add_edge("order_agent", "customer_agent")
    workflow.add_edge("customer_agent", "policy_agent")
    workflow.add_edge("policy_agent", "fraud_agent")
    workflow.add_edge("fraud_agent", "risk_agent")
    workflow.add_edge("risk_agent", "decision_agent")
    workflow.add_edge("decision_agent", END)

    return workflow.compile()


# Compiled Singleton Graph Instance
investigation_app = build_investigation_graph()


def run_investigation_workflow(case_id: int, db: Session) -> Dict[str, Any]:
    """
    Executes the multi-agent investigation workflow for a given case_id.
    Persists per-agent execution logs to the database, creates a persistent InvestigationMemory record,
    and updates ReturnCase status.
    """
    logger.info(f"[ORCHESTRATOR] Starting Multi-Agent Investigation for case_id={case_id}")

    case = investigation_service.get_return_case(db, case_id)
    if not case:
        raise ValueError(f"Return case with ID {case_id} not found.")

    initial_state: InvestigationState = {
        "case_id": case_id,
        "db_session": db,
        "case_data": {
            "id": case.id,
            "case_number": case.case_number,
            "order_id": case.order_id,
            "customer_id": case.customer_id,
            "reason": case.reason,
            "description": case.description,
            "status": case.status
        },
        "investigation_status": "running",
        "errors": []
    }

    # Execute LangGraph Multi-Agent Pipeline
    final_state = investigation_app.invoke(initial_state)

    # Persist individual agent outputs to database InvestigationResult table
    agent_outputs = {
        "OrderAgent": final_state.get("order_result", {}),
        "CustomerAgent": final_state.get("customer_result", {}),
        "PolicyAgent": final_state.get("policy_result", {}),
        "FraudAgent": final_state.get("fraud_result", {}),
        "RiskAgent": final_state.get("risk_result", {}),
        "DecisionAgent": final_state.get("decision_result", {})
    }

    for agent_name, result_data in agent_outputs.items():
        if result_data:
            investigation_service.save_agent_result(
                db=db,
                case_id=case_id,
                agent_name=agent_name,
                result_dict=result_data,
                status="completed"
            )

    # Update ReturnCase entity with final status, risk level, and recommendation
    decision_res = final_state.get("decision_result", {})
    risk_res = final_state.get("risk_result", {})
    policy_res = final_state.get("policy_result", {})

    new_status = decision_res.get("status_update", "Needs Human Review")
    new_risk = risk_res.get("level", "MEDIUM")
    risk_score = risk_res.get("score", 50)
    recommendation = decision_res.get("recommendation", "HUMAN_REVIEW")
    new_decision_text = f"[{recommendation}] {decision_res.get('reason', '')}"

    investigation_service.add_investigation_result(
        db=db,
        case_id=case_id,
        status=new_status,
        risk_level=new_risk,
        final_decision=new_decision_text
    )

    # STEP 3: Create Persistent Investigation Memory Record
    try:
        memory_content = (
            f"Case #{case.case_number} ({case.reason}): Risk {new_risk} (Score {risk_score}/100). "
            f"Policy Eligible: {policy_res.get('eligible', True)}. Recommendation: {recommendation}."
        )
        memory_meta = {
            "return_case_id": case_id,
            "case_number": case.case_number,
            "risk_level": new_risk,
            "risk_score": risk_score,
            "recommendation": recommendation,
            "policy_eligible": policy_res.get("eligible", True)
        }
        memory_service.save_memory(
            db=db,
            customer_id=case.customer_id,
            return_case_id=case_id,
            memory_type="investigation_summary",
            content=memory_content,
            metadata_dict=memory_meta
        )
    except Exception as mem_err:
        logger.error(f"[ORCHESTRATOR] Error saving persistent memory: {mem_err}")

    logger.info(f"[ORCHESTRATOR] Multi-Agent Investigation completed for case_id={case_id}. Final status: {new_status}")

    return {
        "case_id": case_id,
        "status": "completed",
        "result": {
            "order": final_state.get("order_result", {}),
            "customer": final_state.get("customer_result", {}),
            "policy": final_state.get("policy_result", {}),
            "fraud": final_state.get("fraud_result", {}),
            "risk": final_state.get("risk_result", {}),
            "decision": final_state.get("decision_result", {})
        },
        "errors": final_state.get("errors", [])
    }

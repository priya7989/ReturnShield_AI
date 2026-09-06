import logging
from app.agents.state import InvestigationState

logger = logging.getLogger("returnshield.agents.decision")

def run_decision_agent(state: InvestigationState) -> InvestigationState:
    """
    Decision Agent Node Function.
    Synthesizes findings from Order, Customer, Policy, Fraud, and Risk agents
    to determine the recommended case disposition and concise explanation.
    
    Recommendations:
    - APPROVE_REPLACEMENT / APPROVE_REFUND (Policy eligible & LOW risk)
    - HUMAN_REVIEW (Policy eligible but MEDIUM/HIGH risk or missing evidence)
    - REJECT (Ineligible under store return policy)
    """
    case_id = state.get("case_id")
    order_res = state.get("order_result", {})
    pol_res = state.get("policy_result", {})
    fraud_res = state.get("fraud_result", {})
    risk_res = state.get("risk_result", {})
    logger.info(f"[DECISION AGENT] Synthesizing final recommendation for case_id={case_id}")

    try:
        is_eligible = pol_res.get("eligible", False)
        risk_level = risk_res.get("level", "MEDIUM")
        risk_score = risk_res.get("score", 50)
        is_suspicious = fraud_res.get("suspicious", False)

        # Retrieve return claim reason
        case_data = state.get("case_data", {})
        claim_reason = case_data.get("reason", "") if case_data else ""

        # 1. Ineligible under policy -> REJECT
        if not is_eligible:
            recommendation = "REJECT"
            status_update = "Rejected"
            reason_text = f"Claim rejected: {pol_res.get('reason', 'Request exceeds policy guidelines.')}"
            confidence = 0.95

        # 2. High Risk or Fraud Indicators -> HUMAN_REVIEW
        elif risk_level == "HIGH" or is_suspicious or risk_score >= 60:
            recommendation = "HUMAN_REVIEW"
            status_update = "Needs Human Review"
            reason_text = f"Flagged for human supervisor review due to {risk_level} risk score ({risk_score}/100) and elevated return history indicators."
            confidence = 0.85

        # 3. Medium Risk or Missing Evidence -> HUMAN_REVIEW
        elif risk_level == "MEDIUM" or (pol_res.get("evidence_required") and not pol_res.get("evidence_provided")):
            recommendation = "HUMAN_REVIEW"
            status_update = "Needs Human Review"
            reason_text = f"Escalated to human supervisor: Moderate risk level ({risk_score}/100) or missing photo evidence."
            confidence = 0.80

        # 4. Low Risk & Eligible -> APPROVE_REPLACEMENT or APPROVE_REFUND
        else:
            if "Damaged" in claim_reason or "Defective" in claim_reason or "Missing" in claim_reason:
                recommendation = "APPROVE_REPLACEMENT"
                status_update = "Approved"
                reason_text = "The order is valid, the claim was reported within the return period, and no risk indicators were detected. Replacement recommended."
            else:
                recommendation = "APPROVE_REFUND"
                status_update = "Approved"
                reason_text = "The order is valid, request complies with return policy, and risk assessment is low. Full refund recommended."
            confidence = 0.92

        decision_result = {
            "recommendation": recommendation,
            "status_update": status_update,
            "reason": reason_text,
            "confidence_score": confidence,
            "risk_level_assigned": risk_level
        }

        state["decision_result"] = decision_result
        state["investigation_status"] = "completed"
        logger.info(f"[DECISION AGENT] Recommendation determined: {recommendation} (Status: {status_update})")

    except Exception as e:
        logger.error(f"[DECISION AGENT] Error during execution: {e}")
        state.setdefault("errors", []).append(f"DecisionAgent error: {str(e)}")
        state["decision_result"] = {
            "recommendation": "HUMAN_REVIEW",
            "status_update": "Needs Human Review",
            "reason": f"System decision fallback due to processing error: {str(e)}",
            "confidence_score": 0.5
        }
        state["investigation_status"] = "completed"

    return state

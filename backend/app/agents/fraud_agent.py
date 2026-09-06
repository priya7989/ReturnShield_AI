import logging
from app.agents.state import InvestigationState

logger = logging.getLogger("returnshield.agents.fraud")

def run_fraud_agent(state: InvestigationState) -> InvestigationState:
    """
    Fraud Agent Node Function.
    Evaluates customer return frequency, order amount thresholds, and recent claim clusters
    to identify behavioral risk indicators using transparent objective rules.
    """
    case_id = state.get("case_id")
    cust_res = state.get("customer_result", {})
    order_res = state.get("order_result", {})
    logger.info(f"[FRAUD AGENT] Analyzing behavioral risk indicators for case_id={case_id}")

    try:
        reasons = []
        risk_score = 0

        return_ratio = cust_res.get("return_ratio", 0.0)
        previous_returns = cust_res.get("previous_returns", 0)
        recent_returns = cust_res.get("recent_returns", 0)
        order_amount = order_res.get("amount", 0.0)

        # 1. High Return Ratio Indicator
        if return_ratio >= 0.30 and cust_res.get("total_orders", 0) >= 3:
            risk_score += 40
            reasons.append(f"Elevated customer return ratio ({int(return_ratio * 100)}% across past orders)")
        elif return_ratio >= 0.20 and cust_res.get("total_orders", 0) >= 3:
            risk_score += 25
            reasons.append(f"Above-average customer return ratio ({int(return_ratio * 100)}%)")

        # 2. Frequent Recent Return Claims
        if recent_returns >= 3:
            risk_score += 35
            reasons.append(f"Multiple recent return claims submitted ({recent_returns} claims in past 30 days)")
        elif recent_returns >= 2:
            risk_score += 20
            reasons.append(f"Multiple recent return claims detected ({recent_returns} claims in past 30 days)")

        # 3. High-Value Product Return Threshold
        if order_amount >= 1000.0:
            risk_score += 25
            reasons.append(f"High-value order tier (${order_amount:,.2f}) requires elevated review threshold")
        elif order_amount >= 500.0:
            risk_score += 15
            reasons.append(f"Substantial order value (${order_amount:,.2f})")

        # Cap score at 100
        risk_score = min(risk_score, 100)
        is_suspicious = risk_score >= 40

        fraud_result = {
            "suspicious": is_suspicious,
            "risk_score": risk_score,
            "reasons": reasons if reasons else ["No significant behavioral risk indicators detected"]
        }

        state["fraud_result"] = fraud_result
        logger.info(f"[FRAUD AGENT] Behavioral scan complete: suspicious={is_suspicious}, score={risk_score}")

    except Exception as e:
        logger.error(f"[FRAUD AGENT] Error during execution: {e}")
        state.setdefault("errors", []).append(f"FraudAgent error: {str(e)}")
        state["fraud_result"] = {
            "suspicious": False,
            "risk_score": 0,
            "reasons": [f"Execution error: {str(e)}"]
        }

    return state

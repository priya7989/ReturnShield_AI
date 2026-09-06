import logging
from app.agents.state import InvestigationState

logger = logging.getLogger("returnshield.agents.risk")

def run_risk_agent(state: InvestigationState) -> InvestigationState:
    """
    Risk Agent Node Function.
    Combines outputs from Order, Customer, Policy, and Fraud Agents to produce
    an aggregated, transparent risk score (0-100) and risk level (LOW, MEDIUM, HIGH).
    
    Scoring Formula (Explainable Rule Engine):
    - Policy Ineligibility: +45 points
    - Fraud Risk Score: +0.5 * FraudAgent Risk Score
    - High-Value Order (> $500): +15 points
    - Missing Recommended Evidence: +15 points
    - Customer Return History (> 2 returns): +10 points
    """
    case_id = state.get("case_id")
    order_res = state.get("order_result", {})
    cust_res = state.get("customer_result", {})
    pol_res = state.get("policy_result", {})
    fraud_res = state.get("fraud_result", {})
    logger.info(f"[RISK AGENT] Computing composite risk assessment for case_id={case_id}")

    try:
        factors = []
        score = 0

        # 1. Policy Eligibility Factor
        if not pol_res.get("eligible", True):
            score += 45
            factors.append("Policy Violation: Request exceeds allowed return timeframe")

        # 2. Fraud Behavioral Score Contribution
        fraud_score = fraud_res.get("risk_score", 0)
        if fraud_score > 0:
            added_fraud = int(fraud_score * 0.5)
            score += added_fraud
            for r in fraud_res.get("reasons", []):
                if "No significant" not in r:
                    factors.append(f"Fraud Signal: {r}")

        # 3. Missing Photo Evidence for Physical Claims
        if pol_res.get("evidence_required") and not pol_res.get("evidence_provided"):
            score += 15
            factors.append("Evidence Gap: Photo proof missing for physical defect/damage claim")

        # 4. Order Value Tier
        if order_res.get("amount", 0.0) >= 500.0:
            score += 10
            factors.append(f"Order Exposure: High value claim (${order_res.get('amount', 0.0):,.2f})")

        # Cap score between 0 and 100
        score = max(0, min(100, score))

        # Categorize Level
        if score <= 30:
            level = "LOW"
        elif score <= 60:
            level = "MEDIUM"
        else:
            level = "HIGH"

        if not factors:
            factors.append("Clean claim profile — no significant risk factors identified")

        risk_result = {
            "score": score,
            "level": level,
            "factors": factors
        }

        state["risk_result"] = risk_result
        logger.info(f"[RISK AGENT] Composite risk score computed: {score}/100 ({level})")

    except Exception as e:
        logger.error(f"[RISK AGENT] Error during execution: {e}")
        state.setdefault("errors", []).append(f"RiskAgent error: {str(e)}")
        state["risk_result"] = {
            "score": 50,
            "level": "MEDIUM",
            "factors": [f"Risk calculation fallback due to error: {str(e)}"]
        }

    return state

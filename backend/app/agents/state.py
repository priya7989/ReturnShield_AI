from typing import TypedDict, Optional, Dict, Any, List

class InvestigationState(TypedDict, total=False):
    """
    Shared typed state passed sequentially through each LangGraph node in the return investigation workflow.
    Each agent node reads context from this dictionary and appends its structured findings.
    """
    case_id: int
    db_session: Any  # Session object passed for agent tools

    # Raw entity payloads
    case_data: Optional[Dict[str, Any]]
    order_data: Optional[Dict[str, Any]]
    customer_data: Optional[Dict[str, Any]]
    product_data: Optional[Dict[str, Any]]
    customer_history: Optional[Dict[str, Any]]

    # Step 3 RAG & Persistent Memory Extensions
    retrieved_policy_context: Optional[List[Dict[str, Any]]]
    policy_sources: Optional[List[str]]
    customer_memories: Optional[List[Dict[str, Any]]]
    memory_context: Optional[str]

    # Agent specific output dicts
    order_result: Optional[Dict[str, Any]]
    customer_result: Optional[Dict[str, Any]]
    policy_result: Optional[Dict[str, Any]]
    fraud_result: Optional[Dict[str, Any]]
    risk_result: Optional[Dict[str, Any]]
    decision_result: Optional[Dict[str, Any]]

    # Workflow tracking
    investigation_status: str
    errors: List[str]

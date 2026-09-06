import logging
from datetime import datetime
from app.services import investigation_service
from app.agents.state import InvestigationState

logger = logging.getLogger("returnshield.agents.order")

def run_order_agent(state: InvestigationState) -> InvestigationState:
    """
    Order Agent Node Function.
    Retrieves and evaluates order information from the database service layer.
    Determines order presence, delivery status, and elapsed days since delivery.
    """
    case_id = state.get("case_id")
    db = state.get("db_session")
    logger.info(f"[ORDER AGENT] Running order analysis for case_id={case_id}")

    try:
        # Retrieve case
        case = investigation_service.get_return_case(db, case_id) if db and case_id else None
        if not case or not case.order_id:
            logger.warning(f"[ORDER AGENT] Case or order_id missing for case_id={case_id}")
            state["order_result"] = {
                "order_found": False,
                "delivered": False,
                "days_since_delivery": None,
                "amount": 0.0,
                "reason": "Order record not found"
            }
            return state

        order = investigation_service.get_order_details(db, case.order_id)
        if not order:
            logger.warning(f"[ORDER AGENT] Order #{case.order_id} not found")
            state["order_result"] = {
                "order_found": False,
                "delivered": False,
                "days_since_delivery": None,
                "amount": 0.0,
                "reason": f"Order #{case.order_id} not found in database"
            }
            return state

        # Compute delivery timeline
        now = datetime.utcnow()
        is_delivered = order.status == "Delivered" and order.delivery_date is not None
        days_since_delivery = (now - order.delivery_date).days if is_delivered else None

        order_result = {
            "order_found": True,
            "order_id": order.id,
            "order_number": order.order_number,
            "product_id": order.product_id,
            "product_name": order.product.name if order.product else "Unknown Product",
            "amount": float(order.amount),
            "order_status": order.status,
            "delivered": is_delivered,
            "order_date": order.order_date.isoformat() if order.order_date else None,
            "delivery_date": order.delivery_date.isoformat() if order.delivery_date else None,
            "days_since_delivery": days_since_delivery
        }

        # Cache raw data in shared state for downstream agents
        state["order_data"] = order_result
        state["order_result"] = order_result
        logger.info(f"[ORDER AGENT] Order analysis complete: order_number={order.order_number}, days_since_delivery={days_since_delivery}")

    except Exception as e:
        logger.error(f"[ORDER AGENT] Error during execution: {e}")
        state.setdefault("errors", []).append(f"OrderAgent error: {str(e)}")
        state["order_result"] = {
            "order_found": False,
            "delivered": False,
            "error": str(e)
        }

    return state

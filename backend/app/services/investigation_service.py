"""
Investigation Service Layer

This module houses the core database query and management functions for ReturnShield AI.
These functions serve as the foundation for the backend APIs today and will be exposed
directly as tool interfaces for autonomous AI agents (Vision Agent, Order Agent, Policy Agent,
Fraud Agent, Risk Agent, etc.) in Step 2 and beyond.
"""

import uuid
import os
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload
from app.models import Customer, Product, Order, ReturnCase, Evidence, InvestigationResult
from app.schemas.return_case import ReturnCaseCreate, ReturnCaseUpdate


def get_order_details(db: Session, order_id: int) -> Optional[Order]:
    """
    Retrieve comprehensive details for a specific order by order_id.
    Includes customer and product information.
    Future Agent Tool: Order Agent.
    """
    return db.query(Order).options(
        joinedload(Order.product),
        joinedload(Order.customer)
    ).filter(Order.id == order_id).first()


def get_customer_history(db: Session, customer_id: int) -> Optional[Dict[str, Any]]:
    """
    Retrieve customer profile, order history, and previous return case history.
    Future Agent Tool: Fraud Agent & Risk Agent.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        return None

    orders = db.query(Order).filter(Order.customer_id == customer_id).all()
    returns = db.query(ReturnCase).filter(ReturnCase.customer_id == customer_id).all()

    total_spent = sum(o.amount for o in orders)
    total_orders = len(orders)
    total_returns = len(returns)

    return {
        "customer": customer,
        "total_orders": total_orders,
        "total_spent": total_spent,
        "total_returns": total_returns,
        "orders": orders,
        "return_cases": returns
    }


def get_return_case(db: Session, case_id: int) -> Optional[ReturnCase]:
    """
    Retrieve a single return case by ID with pre-joined customer, order, product, and evidence.
    Future Agent Tool: General Orchestrator & All Agents.
    """
    return db.query(ReturnCase).options(
        joinedload(ReturnCase.customer),
        joinedload(ReturnCase.order).joinedload(Order.product),
        joinedload(ReturnCase.evidence_list)
    ).filter(ReturnCase.id == case_id).first()


def get_product_details(db: Session, product_id: int) -> Optional[Product]:
    """
    Retrieve detailed specs, category, seller, and warranty details for a product.
    Future Agent Tool: Policy/RAG Agent.
    """
    return db.query(Product).filter(Product.id == product_id).first()


def get_customer_return_history(db: Session, customer_id: int) -> List[ReturnCase]:
    """
    Fetch all previous return investigation cases submitted by a specific customer.
    Future Agent Tool: Fraud Agent.
    """
    return db.query(ReturnCase).options(
        joinedload(ReturnCase.order).joinedload(Order.product),
        joinedload(ReturnCase.evidence_list)
    ).filter(ReturnCase.customer_id == customer_id).order_by(ReturnCase.created_at.desc()).all()


def update_return_case(db: Session, case_id: int, update_data: ReturnCaseUpdate) -> Optional[ReturnCase]:
    """
    Update status, risk level, or final decision of a return case.
    Future Agent Tool: Decision Agent & Risk Agent.
    """
    return_case = db.query(ReturnCase).filter(ReturnCase.id == case_id).first()
    if not return_case:
        return None

    if update_data.status is not None:
        return_case.status = update_data.status
    if update_data.risk_level is not None:
        return_case.risk_level = update_data.risk_level
    if update_data.final_decision is not None:
        return_case.final_decision = update_data.final_decision

    return_case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(return_case)
    return get_return_case(db, case_id)


def add_investigation_result(
    db: Session,
    case_id: int,
    status: str,
    risk_level: str,
    final_decision: str
) -> Optional[ReturnCase]:
    """
    Record agent investigation findings and final determination on a case.
    Future Agent Tool: Action Agent / Decision Agent.
    """
    return_case = db.query(ReturnCase).filter(ReturnCase.id == case_id).first()
    if not return_case:
        return None

    return_case.status = status
    return_case.risk_level = risk_level
    return_case.final_decision = final_decision
    return_case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(return_case)
    return get_return_case(db, case_id)


def create_return_case(db: Session, case_in: ReturnCaseCreate) -> ReturnCase:
    """
    Create a new return investigation case in the database.
    Assigns a unique case_number (e.g., RET-2026-XXXX).
    """
    # Verify order and customer exist
    order = db.query(Order).filter(Order.id == case_in.order_id).first()
    if not order:
        raise ValueError(f"Order with ID {case_in.order_id} not found.")

    # Generate unique case number
    case_count = db.query(ReturnCase).count() + 1
    random_code = str(uuid.uuid4().hex[:4]).upper()
    case_number = f"RET-2026-{case_count:04d}-{random_code}"

    new_case = ReturnCase(
        case_number=case_number,
        order_id=case_in.order_id,
        customer_id=case_in.customer_id,
        reason=case_in.reason,
        description=case_in.description,
        status="Pending",
        risk_level="Unassessed",
        final_decision="Pending AI Investigation"
    )

    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return get_return_case(db, new_case.id)


def save_evidence(
    db: Session,
    case_id: int,
    file_name: str,
    file_path: str,
    evidence_type: str = "image"
) -> Evidence:
    """
    Record uploaded evidence metadata for a return investigation case.
    """
    new_evidence = Evidence(
        return_case_id=case_id,
        file_name=file_name,
        file_path=file_path,
        evidence_type=evidence_type
    )
    db.add(new_evidence)
    db.commit()
    db.refresh(new_evidence)
    return new_evidence


def list_all_returns(
    db: Session,
    status: Optional[str] = None,
    risk_level: Optional[str] = None
) -> List[ReturnCase]:
    """
    Fetch all return cases with optional filtering.
    """
    query = db.query(ReturnCase).options(
        joinedload(ReturnCase.customer),
        joinedload(ReturnCase.order).joinedload(Order.product),
        joinedload(ReturnCase.evidence_list)
    )

    if status:
        query = query.filter(ReturnCase.status == status)
    if risk_level:
        query = query.filter(ReturnCase.risk_level == risk_level)

    return query.order_by(ReturnCase.created_at.desc()).all()


def save_agent_result(
    db: Session,
    case_id: int,
    agent_name: str,
    result_dict: dict,
    status: str = "completed"
) -> InvestigationResult:
    """
    Store per-agent execution logs and outputs in the database for observability.
    """
    res = InvestigationResult(
        return_case_id=case_id,
        agent_name=agent_name,
        status=status,
        result_json=json.dumps(result_dict, default=str)
    )
    db.add(res)
    db.commit()
    db.refresh(res)
    return res


def get_case_investigation_results(db: Session, case_id: int) -> List[InvestigationResult]:
    """
    Retrieve historical agent execution outputs for a specific return case.
    """
    return db.query(InvestigationResult).filter(
        InvestigationResult.return_case_id == case_id
    ).order_by(InvestigationResult.created_at.asc()).all()

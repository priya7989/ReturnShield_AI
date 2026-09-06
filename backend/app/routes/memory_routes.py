import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.memory import memory_service
from app.services import investigation_service

router = APIRouter(tags=["Memory"])

@router.get("/api/customers/{customer_id}/memories")
def get_customer_persistent_memories(customer_id: int, db: Session = Depends(get_db)):
    """
    Retrieve historical persistent investigation memories for a customer across all claims.
    """
    memories = memory_service.get_customer_memories(db, customer_id, limit=20)
    parsed = []
    for m in memories:
        parsed.append({
            "id": m.id,
            "customer_id": m.customer_id,
            "return_case_id": m.return_case_id,
            "memory_type": m.memory_type,
            "content": m.content,
            "metadata": json.loads(m.metadata_json) if m.metadata_json else {},
            "created_at": m.created_at
        })

    return {
        "customer_id": customer_id,
        "total_memories": len(parsed),
        "memories": parsed
    }


@router.get("/api/returns/{case_id}/memories")
def get_case_persistent_memories(case_id: int, db: Session = Depends(get_db)):
    """
    Retrieve persistent memories generated specifically for a return case.
    """
    case = investigation_service.get_return_case(db, case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Return case with ID {case_id} not found."
        )

    memories = memory_service.get_case_memories(db, case_id)
    parsed = []
    for m in memories:
        parsed.append({
            "id": m.id,
            "customer_id": m.customer_id,
            "return_case_id": m.return_case_id,
            "memory_type": m.memory_type,
            "content": m.content,
            "metadata": json.loads(m.metadata_json) if m.metadata_json else {},
            "created_at": m.created_at
        })

    return {
        "case_id": case_id,
        "total_memories": len(parsed),
        "memories": parsed
    }

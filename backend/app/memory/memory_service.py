import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import InvestigationMemory

logger = logging.getLogger("returnshield.memory.service")

def save_memory(
    db: Session,
    customer_id: int,
    return_case_id: int,
    memory_type: str,
    content: str,
    metadata_dict: Optional[Dict[str, Any]] = None
) -> InvestigationMemory:
    """
    Persist a concise, high-value investigation memory record into SQLite.
    Survives application restarts for long-term customer context.
    """
    metadata_json = json.dumps(metadata_dict, default=str) if metadata_dict else None

    mem = InvestigationMemory(
        customer_id=customer_id,
        return_case_id=return_case_id,
        memory_type=memory_type,
        content=content,
        metadata_json=metadata_json,
        created_at=datetime.utcnow()
    )

    db.add(mem)
    db.commit()
    db.refresh(mem)

    logger.info(f"[PERSISTENT MEMORY] Saved memory for customer={customer_id}, case={return_case_id}, type='{memory_type}'")
    return mem


def get_customer_memories(db: Session, customer_id: int, limit: int = 10) -> List[InvestigationMemory]:
    """
    Retrieve historical persistent memories for a specific customer across all past return cases.
    """
    return db.query(InvestigationMemory).filter(
        InvestigationMemory.customer_id == customer_id
    ).order_by(InvestigationMemory.created_at.desc()).limit(limit).all()


def get_case_memories(db: Session, case_id: int) -> List[InvestigationMemory]:
    """
    Retrieve memories created specifically during a given return case investigation.
    """
    return db.query(InvestigationMemory).filter(
        InvestigationMemory.return_case_id == case_id
    ).order_by(InvestigationMemory.created_at.asc()).all()


def get_recent_customer_memories(db: Session, customer_id: int, limit: int = 5) -> List[InvestigationMemory]:
    """
    Retrieve recent investigation memories for Customer Agent context injection.
    """
    return get_customer_memories(db, customer_id, limit=limit)

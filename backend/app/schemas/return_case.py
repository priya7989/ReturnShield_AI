from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.customer import CustomerOut
from app.schemas.order import OrderOut
from app.schemas.evidence import EvidenceOut

class ReturnCaseCreate(BaseModel):
    order_id: int
    customer_id: int
    reason: str
    description: str

class ReturnCaseUpdate(BaseModel):
    status: Optional[str] = None
    risk_level: Optional[str] = None
    final_decision: Optional[str] = None

class ReturnCaseOut(BaseModel):
    id: int
    case_number: str
    order_id: int
    customer_id: int
    reason: str
    description: str
    status: str
    risk_level: str
    final_decision: str
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerOut] = None
    order: Optional[OrderOut] = None
    evidence_list: List[EvidenceOut] = []

    class Config:
        from_attributes = True

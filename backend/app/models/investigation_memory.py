from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class InvestigationMemory(Base):
    __tablename__ = "investigation_memories"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    return_case_id = Column(Integer, ForeignKey("return_cases.id"), nullable=False)
    memory_type = Column(String(100), nullable=False)  # investigation_summary, previous_decision, return_pattern, policy_outcome, risk_observation
    content = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)  # Structured JSON metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    customer = relationship("Customer")
    return_case = relationship("ReturnCase")

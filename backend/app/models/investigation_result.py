from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class InvestigationResult(Base):
    __tablename__ = "investigation_results"

    id = Column(Integer, primary_key=True, index=True)
    return_case_id = Column(Integer, ForeignKey("return_cases.id"), nullable=False)
    agent_name = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="completed")  # completed, failed
    result_json = Column(Text, nullable=False)  # JSON string output from agent
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    return_case = relationship("ReturnCase")

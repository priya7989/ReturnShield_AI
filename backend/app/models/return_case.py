from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ReturnCase(Base):
    __tablename__ = "return_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    reason = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="Pending")  # Pending, Approved, Rejected, Needs Human Review
    risk_level = Column(String(50), nullable=False, default="Unassessed")  # Low, Medium, High, Unassessed
    final_decision = Column(String(100), nullable=False, default="Pending Investigation")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="return_cases")
    order = relationship("Order", back_populates="return_cases")
    evidence_list = relationship("Evidence", back_populates="return_case", cascade="all, delete-orphan")

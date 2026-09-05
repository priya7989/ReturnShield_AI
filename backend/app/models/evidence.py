from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    return_case_id = Column(Integer, ForeignKey("return_cases.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    evidence_type = Column(String(50), nullable=False, default="image")  # image, document, video, etc.
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    return_case = relationship("ReturnCase", back_populates="evidence_list")

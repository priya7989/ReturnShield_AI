from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    seller = Column(String(100), nullable=False)
    warranty_period = Column(String(50), nullable=False)  # e.g., "12 Months", "24 Months"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    orders = relationship("Order", back_populates="product", cascade="all, delete-orphan")

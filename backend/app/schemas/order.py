from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.schemas.product import ProductOut
from app.schemas.customer import CustomerOut

class OrderBase(BaseModel):
    order_number: str
    customer_id: int
    product_id: int
    amount: float
    status: str

class OrderCreate(OrderBase):
    delivery_date: Optional[datetime] = None

class OrderOut(OrderBase):
    id: int
    order_date: datetime
    delivery_date: Optional[datetime] = None
    product: Optional[ProductOut] = None
    customer: Optional[CustomerOut] = None

    class Config:
        from_attributes = True

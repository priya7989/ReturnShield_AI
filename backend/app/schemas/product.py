from datetime import datetime
from pydantic import BaseModel

class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    seller: str
    warranty_period: str

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

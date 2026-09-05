from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Order
from app.schemas.order import OrderOut

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.get("", response_model=List[OrderOut])
def list_orders(db: Session = Depends(get_db)):
    """
    Retrieve all customer orders with product and customer details.
    """
    return db.query(Order).options(
        joinedload(Order.product),
        joinedload(Order.customer)
    ).order_by(Order.order_date.desc()).all()

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Customer
from app.schemas.customer import CustomerOut

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    """
    Retrieve all registered customers.
    """
    return db.query(Customer).order_by(Customer.name.asc()).all()

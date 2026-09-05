from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Product
from app.schemas.product import ProductOut

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db)):
    """
    Retrieve all products in the catalog.
    """
    return db.query(Product).order_by(Product.name.asc()).all()

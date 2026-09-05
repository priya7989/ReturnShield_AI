import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure backend root is in import path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.seed import seed_database
from app.routes import (
    health_router,
    customers_router,
    products_router,
    orders_router,
    returns_router
)

app = FastAPI(
    title="ReturnShield AI API",
    description="Autonomous E-Commerce Returns & Refund Investigation System - Step 1 Foundation API",
    version="1.0.0"
)

# Configure CORS
origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount static files
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include Routers
app.include_router(health_router)
app.include_router(customers_router)
app.include_router(products_router)
app.include_router(orders_router)
app.include_router(returns_router)


@app.on_event("startup")
def startup_event():
    """
    Automatic table initialization & database seeding on backend launch.
    """
    Base.metadata.create_all(bind=engine)
    seed_database()


@app.get("/")
def root():
    return {
        "system": "ReturnShield AI Backend Service",
        "status": "online",
        "documentation": "/docs",
        "health": "/api/health"
    }

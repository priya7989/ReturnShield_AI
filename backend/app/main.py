import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.seed import seed_database
from app.rag import initialize_vector_store, index_policy_documents
from app.routes import (
    health_router,
    customers_router,
    products_router,
    orders_router,
    returns_router,
    memory_router,
    rag_router
)

app = FastAPI(
    title="ReturnShield AI API",
    description="Autonomous E-Commerce Returns & Refund Investigation System - Step 3 RAG & Memory API",
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
app.include_router(memory_router)
app.include_router(rag_router)


@app.on_event("startup")
def startup_event():
    """
    Startup initialization:
    1. Create database tables
    2. Seed database
    3. Initialize ChromaDB vector store and index policy documents if empty
    """
    Base.metadata.create_all(bind=engine)
    seed_database()
    try:
        initialize_vector_store()
        index_policy_documents(force=False)
    except Exception as e:
        print(f"Warning: Vector store initialization deferred: {e}")


@app.get("/")
def root():
    return {
        "system": "ReturnShield AI Backend Service",
        "version": "Step 3 (Proper RAG + Persistent Memory)",
        "status": "online",
        "documentation": "/docs",
        "health": "/api/health"
    }

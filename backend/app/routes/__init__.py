from app.routes.health import router as health_router
from app.routes.customers import router as customers_router
from app.routes.products import router as products_router
from app.routes.orders import router as orders_router
from app.routes.returns import router as returns_router
from app.routes.memory_routes import router as memory_router
from app.routes.rag_routes import router as rag_router

__all__ = [
    "health_router",
    "customers_router",
    "products_router",
    "orders_router",
    "returns_router",
    "memory_router",
    "rag_router"
]

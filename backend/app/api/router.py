"""Master API router — includes all v1 sub-routers."""

from fastapi import APIRouter

from app.api.v1 import auth, cart, categories, orders, products, shops

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(shops.router)
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(cart.router)
api_router.include_router(orders.router)

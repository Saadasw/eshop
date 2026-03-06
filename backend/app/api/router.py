"""Master API router — includes all v1 sub-routers."""

from fastapi import APIRouter

from app.api.v1 import (
    addresses,
    admin,
    auth,
    bulk,
    cart,
    categories,
    coupons,
    notifications,
    orders,
    payouts,
    products,
    refunds,
    reviews,
    shops,
    wishlist,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(shops.router)
api_router.include_router(categories.router)
api_router.include_router(products.router)
api_router.include_router(cart.router)
api_router.include_router(orders.router)
api_router.include_router(coupons.router)
api_router.include_router(reviews.router)
api_router.include_router(addresses.router)
api_router.include_router(wishlist.router)
api_router.include_router(notifications.router)
api_router.include_router(refunds.router)
api_router.include_router(payouts.router)
api_router.include_router(admin.router)
api_router.include_router(bulk.router)

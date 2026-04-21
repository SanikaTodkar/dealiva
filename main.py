from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings
from app.routers.auth import router as auth_router
from app.routers.cart import router as cart_router
from app.routers.orders import router as orders_router
from app.routers.payments import router as payments_router
from app.routers.products import router as products_router
from app.routers.products import shop_products_router
from app.routers.shops import router as shops_router
from app.routers.ratings import router as ratings_router
from app.routers.admin import router as admin_router
from app.routers.recommendations import router as recommendations_router


app = FastAPI(title="Dealiva API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(auth_router)
app.include_router(shops_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(payments_router)

# React frontend API prefix
app.include_router(auth_router, prefix="/api")
app.include_router(shops_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(shop_products_router, prefix="/api")
app.include_router(cart_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(payments_router, prefix="/api")
app.include_router(ratings_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(recommendations_router, prefix="/api")


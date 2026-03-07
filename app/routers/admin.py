from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.order import Order
from app.models.shop import Shop
from app.models.user import User
from app.schemas.shop import ShopRead


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/shops", response_model=list[ShopRead])
def list_shops_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> list[Shop]:
    stmt = select(Shop).order_by(Shop.id.desc())
    return list(db.scalars(stmt).all())


@router.patch("/shops/{shop_id}/approve", response_model=ShopRead)
def approve_shop(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Shop:
    shop = db.get(Shop, shop_id)
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found"
        )
    shop.status = "approved"
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return shop


@router.patch("/shops/{shop_id}/block", response_model=ShopRead)
def block_shop(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> Shop:
    shop = db.get(Shop, shop_id)
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found"
        )
    shop.status = "blocked"
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return shop


@router.get("/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> dict:
    total_shops = db.scalar(select(func.count(Shop.id))) or 0
    total_customers = db.scalar(
        select(func.count(User.id)).where(User.role == "customer")
    ) or 0
    total_orders = db.scalar(select(func.count(Order.id))) or 0
    total_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.status.in_(["Paid", "Completed"])
        )
    ) or 0

    return {
        "total_shops": int(total_shops),
        "total_customers": int(total_customers),
        "total_orders": int(total_orders),
        "total_revenue": float(total_revenue),
    }


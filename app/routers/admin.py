from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.order import Order
from app.models.shop import Shop
from app.models.user import User
from app.schemas.shop import ShopRead
from app.schemas.user import UserRead


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/shops", response_model=list[ShopRead])
def list_shops_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    limit: int = Query(10, le= 100),
    offset: int = Query(0),
) -> list[Shop]:
    stmt = select(Shop).offset(offset).limit(limit)
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
    if not shop.is_otp_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shop OTP not verified yet",
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


@router.get("/customers", response_model=list[UserRead])
def list_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> list[User]:
    stmt = select(User).where(User.role == "customer").order_by(User.id.desc())
    return list(db.scalars(stmt).all())


@router.patch("/customers/{user_id}/block", response_model=UserRead)
def block_customer(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> User:
    user = db.get(User, user_id)
    if not user or user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found"
        )
    user.is_blocked = True
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/customers/{user_id}/unblock", response_model=UserRead)
def unblock_customer(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> User:
    user = db.get(User, user_id)
    if not user or user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found"
        )
    user.is_blocked = False
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


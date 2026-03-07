from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import require_shop_owner
from app.db.session import get_db
from app.models.rating import Rating
from app.models.shop import Shop
from app.models.user import User
from app.schemas.shop import ShopCreate, ShopRead, ShopUpdate
from app.schemas.shop_public import ShopDetailRead as ShopDetailPublicRead
from app.schemas.shop_public import ShopRead as ShopPublicRead
from app.schemas.rating import ShopRatingsResponse, ShopRatingItem
from app.models.product import Product
from app.models.order import Order


router = APIRouter(prefix="/shops", tags=["shops"])


@router.get("", response_model=list[ShopPublicRead])
def list_shops(
    city: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[ShopPublicRead]:
    stmt = (
        select(
            Shop.id.label("id"),
            Shop.name.label("shop_name"),
            Shop.city.label("city"),
            func.coalesce(func.avg(Rating.rating), 0.0).label("rating"),
        )
        .select_from(Shop)
        .outerjoin(Rating, Rating.shop_id == Shop.id)
        .where(Shop.status == "approved")
        .group_by(Shop.id, Shop.name, Shop.city)
        .order_by(Shop.id.desc())
    )

    if city:
        stmt = stmt.where(func.lower(Shop.city) == city.strip().lower())

    rows = db.execute(stmt).mappings().all()
    return [ShopPublicRead(**dict(r)) for r in rows]


@router.get("/{shop_id}", response_model=ShopDetailPublicRead)
def get_shop_details(shop_id: int, db: Session = Depends(get_db)) -> ShopDetailPublicRead:
    stmt = (
        select(
            Shop.id.label("id"),
            Shop.name.label("shop_name"),
            Shop.address.label("address"),
            Shop.city.label("city"),
            func.coalesce(func.avg(Rating.rating), 0.0).label("rating"),
        )
        .select_from(Shop)
        .outerjoin(Rating, Rating.shop_id == Shop.id)
        .where(Shop.id == shop_id, Shop.status == "approved")
        .group_by(Shop.id, Shop.name, Shop.address, Shop.city)
    )
    row = db.execute(stmt).mappings().one_or_none()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found"
        )
    return ShopDetailPublicRead(**dict(row))


@router.get("/{shop_id}/ratings", response_model=ShopRatingsResponse)
def get_shop_ratings(shop_id: int, db: Session = Depends(get_db)) -> ShopRatingsResponse:
    shop = db.get(Shop, shop_id)
    if not shop or shop.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found"
        )

    agg_row = db.execute(
        select(
            func.coalesce(func.avg(Rating.rating), 0.0),
            func.count(Rating.id),
        ).where(Rating.shop_id == shop_id)
    ).one()
    average_rating = float(agg_row[0]) if agg_row[1] > 0 else 0.0
    total_ratings = int(agg_row[1])

    rows = db.execute(
        select(User.name, Rating.rating, Rating.feedback)
        .join(User, User.id == Rating.user_id)
        .where(Rating.shop_id == shop_id)
        .order_by(Rating.created_at.desc())
    ).all()

    ratings = [
        ShopRatingItem(user_name=name, rating=rating, feedback=feedback)
        for name, rating, feedback in rows
    ]

    return ShopRatingsResponse(
        average_rating=average_rating,
        total_ratings=total_ratings,
        ratings=ratings,
    )


@router.get("/dashboard")
def shop_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_shop_owner),
) -> dict:
    shop = db.scalar(select(Shop).where(Shop.owner_id == current_user.id))
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found. Register your shop first.",
        )

    total_products = db.scalar(
        select(func.count(Product.id)).where(Product.shop_id == shop.id)
    ) or 0

    total_orders = db.scalar(
        select(func.count(Order.id)).where(Order.shop_id == shop.id)
    ) or 0

    total_revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.shop_id == shop.id,
            Order.status.in_(["Paid", "Completed"]),
        )
    ) or 0

    from datetime import date, timedelta

    today = date.today()
    upcoming = today + timedelta(days=7)

    near_expiry_products = db.scalar(
        select(func.count(Product.id)).where(
            Product.shop_id == shop.id,
            Product.expiry_date.is_not(None),
            Product.expiry_date >= today,
            Product.expiry_date <= upcoming,
            Product.stock > 0,
        )
    ) or 0

    return {
        "total_products": int(total_products),
        "total_orders": int(total_orders),
        "total_revenue": float(total_revenue),
        "near_expiry_products": int(near_expiry_products),
    }


@router.post("/register", response_model=ShopRead, status_code=status.HTTP_201_CREATED)
def register_shop(
    payload: ShopCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_shop_owner),
) -> Shop:
    existing = db.scalar(select(Shop).where(Shop.owner_id == current_user.id))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Shop already registered for this account",
        )

    shop = Shop(
        owner_id=current_user.id,
        name=payload.name,
        address=payload.address,
        city=payload.city,
    )
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return shop


@router.get("/my-shop", response_model=ShopRead)
def my_shop(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_shop_owner),
) -> Shop:
    shop = db.scalar(select(Shop).where(Shop.owner_id == current_user.id))
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found"
        )
    return shop


@router.put("/update", response_model=ShopRead)
def update_shop(
    payload: ShopUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_shop_owner),
) -> Shop:
    shop = db.scalar(select(Shop).where(Shop.owner_id == current_user.id))
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found"
        )

    if payload.name is not None:
        shop.name = payload.name
    if payload.address is not None:
        shop.address = payload.address
    if payload.city is not None:
        shop.city = payload.city

    db.add(shop)
    db.commit()
    db.refresh(shop)
    return shop


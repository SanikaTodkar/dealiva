from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import SQLAlchemyError

from app.core.deps import require_customer, require_shop_owner
from app.db.session import get_db
from app.models.order import Order, OrderStatus
from app.schemas.order import OrderItemRead
from app.models.shop import Shop
from app.models.user import User
from app.schemas.order import OrderRead
from app.schemas.order_shop import OrderShopRead, OrderStatusUpdate
from app.services.order_status import enforce_transition
from app.services.order_service import create_order_service


router = APIRouter(prefix="/orders", tags=["orders"])

def _order_to_shop_read(order: Order) -> OrderShopRead:
    return OrderShopRead(
        order_id=order.id,
        customer_id=order.user_id,
        items= [
            OrderItemRead(
                product_id = i.product_id,
                quantity = i.quantity,
                unit_price = Decimal(str(i.unit_price)),
                line_total = Decimal(str(i.line_total)),
            )
            for i in order.items
        ],
        total_amount=Decimal(str(order.total_amount)),
        status=order.status,
    )

@router.post("/create", response_model= OrderRead)
def create_order(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    return create_order_service(db, current_user)


@router.get("/my-orders", response_model=list[OrderRead])
def my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
) -> list[Order]:
    stmt = (
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.id.desc())
        .options(selectinload(Order.items))
    )
    return list(db.scalars(stmt).all())


@router.get("/shop", response_model=list[OrderShopRead])
def shop_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_shop_owner),
) -> list[OrderShopRead]:
    shop = db.scalar(select(Shop).where(Shop.owner_id == current_user.id))
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found. Register your shop first.",
        )

    stmt = (
        select(Order)
        .where(Order.shop_id == shop.id)
        .order_by(Order.id.desc())
        .options(selectinload(Order.items))
    )
    orders = list(db.scalars(stmt).unique().all())
    return [_order_to_shop_read(o) for o in orders]


@router.patch("/{order_id}/status", response_model=OrderShopRead)
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_shop_owner),
) -> OrderShopRead:
    shop = db.scalar(select(Shop).where(Shop.owner_id == current_user.id))
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shop not found. Register your shop first.",
        )

    order = db.get(Order, order_id)
    if not order or order.shop_id != shop.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    enforce_transition(OrderStatus(order.status), payload.status)
    order.status = payload.status
    db.add(order)
    db.commit()

    loaded = db.scalars(
        select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    ).unique().one()
    return _order_to_shop_read(loaded)


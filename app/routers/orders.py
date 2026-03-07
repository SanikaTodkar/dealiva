from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.deps import require_customer, require_shop_owner
from app.db.session import get_db
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.shop import Shop
from app.models.user import User
from app.schemas.order import OrderRead
from app.schemas.order_shop import OrderShopRead, OrderStatusUpdate


router = APIRouter(prefix="/orders", tags=["orders"])

def _order_to_shop_read(order: Order) -> OrderShopRead:
    return OrderShopRead(
        order_id=order.id,
        customer_id=order.user_id,
        items=list(order.items),
        total_amount=Decimal(str(order.total_amount)),
        status=order.status,
    )


@router.post("/create", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
) -> Order:
    cart = db.scalar(select(Cart).where(Cart.user_id == current_user.id))
    if not cart or cart.shop_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty"
        )

    stmt = (
        select(CartItem, Product)
        .join(Product, Product.id == CartItem.product_id)
        .where(CartItem.cart_id == cart.id)
    )
    rows = db.execute(stmt).all()
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty"
        )

    # Validate stock + compute totals
    total = Decimal("0.00")
    items_to_create: list[OrderItem] = []
    for cart_item, product in rows:
        if cart_item.quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough stock for product_id={product.id}",
            )

        unit_price = Decimal(str(product.price))
        line_total = unit_price * cart_item.quantity
        total += line_total
        items_to_create.append(
            OrderItem(
                product_id=product.id,
                quantity=cart_item.quantity,
                unit_price=unit_price,
                line_total=line_total,
            )
        )

    order = Order(
        user_id=current_user.id,
        shop_id=cart.shop_id,
        status="Placed",
        total_amount=total,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    for item in items_to_create:
        item.order_id = order.id
        db.add(item)

    # Decrement stock
    for cart_item, product in rows:
        product.stock -= cart_item.quantity
        db.add(product)

    # Clear cart
    for cart_item, _product in rows:
        db.delete(cart_item)
    cart.shop_id = None
    db.add(cart)

    db.commit()
    loaded = db.scalars(
        select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    ).unique().one()
    return loaded


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

    order.status = payload.status
    db.add(order)
    db.commit()

    loaded = db.scalars(
        select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    ).unique().one()
    return _order_to_shop_read(loaded)


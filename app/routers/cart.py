from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_customer
from app.db.session import get_db
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.product import Product
from app.models.shop import Shop
from app.models.user import User
from app.schemas.cart import (
    CartRead,
    CartRemoveRequest,
    CartUpdateQuantityRequest,
    ShopSummary,
)
from app.services.cart_service import add_to_cart_service
from app.schemas.cart import CartAddRequest


router = APIRouter(prefix="/cart", tags=["cart"])

@router.post("/add", response_model=CartRead)
def add_to_cart(
    payload: CartAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    cart = add_to_cart_service(db = db, user_id = current_user.id, product_id = payload.product_id, quantity = payload.quantity,)

    return get_cart(db = db, current_user = current_user)

@router.post("/remove", response_model=CartRead)
def remove_from_cart(
    payload: CartRemoveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
) -> CartRead:
    cart = db.scalar(select(Cart).where(Cart.user_id == current_user.id))
    if not cart:
        return CartRead(shop_id=None, items=[], total_amount=Decimal("0.00"))

    item = db.scalar(
        select(CartItem).where(
            CartItem.cart_id == cart.id, CartItem.product_id == payload.product_id
        )
    )
    if not item:
        return get_cart(db=db, current_user=current_user)

    db.delete(item)
    db.commit()

    # If cart is empty, reset shop_id
    remaining = db.scalar(select(CartItem).where(CartItem.cart_id == cart.id))
    if remaining is None:
        cart.shop_id = None
        db.add(cart)
        db.commit()

    return get_cart(db=db, current_user=current_user)


@router.post("/update-quantity", response_model=CartRead)
def update_quantity(
    payload: CartUpdateQuantityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
) -> CartRead:
    cart = db.scalar(select(Cart).where(Cart.user_id == current_user.id))
    if not cart:
        return CartRead(shop_id=None, shop=None, items=[], total_amount=Decimal("0.00"))

    item = db.scalar(
        select(CartItem).where(
            CartItem.cart_id == cart.id, CartItem.product_id == payload.product_id
        )
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Item not found in cart"
        )

    if payload.quantity == 0:
        db.delete(item)
        db.commit()
    else:
        item.quantity = payload.quantity
        db.add(item)
        db.commit()

    remaining = db.scalar(select(CartItem).where(CartItem.cart_id == cart.id))
    if remaining is None:
        cart.shop_id = None
        db.add(cart)
        db.commit()

    return get_cart(db=db, current_user=current_user)


@router.get("", response_model=CartRead)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
) -> CartRead:
    cart = db.scalar(select(Cart).where(Cart.user_id == current_user.id))
    if not cart:
        return CartRead(shop_id=None, shop=None, items=[], total_amount=Decimal("0.00"))

    shop_summary: ShopSummary | None = None
    if cart.shop_id is not None:
        shop = db.get(Shop, cart.shop_id)
        if shop:
            shop_summary = ShopSummary(
                id=shop.id, name=shop.name, address=shop.address, city=shop.city
            )

    stmt = (
        select(CartItem, Product)
        .join(Product, Product.id == CartItem.product_id)
        .where(CartItem.cart_id == cart.id)
        .order_by(CartItem.id.asc())
    )
    rows = db.execute(stmt).all()

    items = []
    total = Decimal("0.00")
    for cart_item, product in rows:
        price = Decimal(str(product.price))
        line_total = price * cart_item.quantity
        total += line_total
        items.append(
            {
                "product_id": product.id,
                "name": product.name,
                "description": product.description,
                "price": price,
                "quantity": cart_item.quantity,
                "line_total": line_total,
                "image_url": product.image_url,
            }
        )

    return CartRead(shop_id=cart.shop_id, shop=shop_summary, items=items, total_amount=total)


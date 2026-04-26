from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.product import Product
from app.models.shop import Shop


def get_or_create_cart(db: Session, user_id: int) -> Cart:
    cart = db.scalar(select(Cart).where(Cart.user_id == user_id))
    if cart:
        return cart

    cart = Cart(user_id=user_id, shop_id=None)
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart


def add_to_cart_service(
    db: Session,
    user_id: int,
    product_id: int,
    quantity: int,
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    cart = get_or_create_cart(db, user_id)

    # one shop rule
    if cart.shop_id is None:
        cart.shop_id = product.shop_id
    elif cart.shop_id != product.shop_id:
        raise HTTPException(
            status_code=400,
            detail="Cart can only contain products from one shop",
        )

    item = db.scalar(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == product_id,
        )
    )

    if item:
        item.quantity += quantity
    else:
        item = CartItem(
            cart_id=cart.id,
            product_id=product_id,
            quantity=quantity,
        )
        db.add(item)

    db.add(cart)
    db.commit()

    return cart
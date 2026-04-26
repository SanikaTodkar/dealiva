from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User


def create_order_service(db: Session, current_user: User) -> Order:
    try:
        cart = db.scalar(select(Cart).where(Cart.user_id == current_user.id))

        if not cart or cart.shop_id is None:
            raise HTTPException(status_code=400, detail="Cart is empty")

        rows = db.execute(
            select(CartItem, Product)
            .join(Product, Product.id == CartItem.product_id)
            .where(CartItem.cart_id == cart.id)
        ).all()

        if not rows:
            raise HTTPException(status_code=400, detail="Cart is empty")

        total = Decimal("0.00")
        items_to_create = []

        for cart_item, product in rows:
            if cart_item.quantity > product.stock:
                raise HTTPException(
                    status_code=400,
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
        db.flush()

        for item in items_to_create:
            item.order_id = order.id
            db.add(item)

        # stock update
        for cart_item, product in rows:
            product.stock -= cart_item.quantity
            db.add(product)

        # clear cart
        for cart_item, _ in rows:
            db.delete(cart_item)

        cart.shop_id = None
        db.add(cart)

        db.commit()
        db.refresh(order)

    except Exception:
        db.rollback()
        raise

    return order
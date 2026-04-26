from decimal import Decimal, ROUND_HALF_UP
import razorpay
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Any

from app.core.config import settings
from app.models.order import Order, OrderStatus
from app.services.order_status import enforce_transition


def get_razorpay_client() -> Any:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(status_code=500, detail="Razorpay not configured")
    return razorpay.Client(
        auth=(settings.razorpay_key_id, settings.razorpay_key_secret)
    )


def create_payment_order(db: Session, order: Order):
    if order.status != "Placed":
        raise HTTPException(status_code=400, detail="Invalid order state")

    amount = Decimal(str(order.total_amount))
    amount_paise = int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    client = get_razorpay_client()
    rp_order = client.order.create(
        {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"dealiva_order_{order.id}",
        }
    )   # type:ignore

    order.payment_provider = "razorpay"
    order.razorpay_order_id = rp_order["id"]

    db.add(order)
    db.commit()

    return rp_order


def verify_payment(db: Session, order: Order, payload, client):
    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": payload.razorpay_order_id,
                "razorpay_payment_id": payload.razorpay_payment_id,
                "razorpay_signature": payload.razorpay_signature,
            }
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Verification failed")

    enforce_transition(order.status, OrderStatus.PAID)

    order.status = OrderStatus.PAID
    order.razorpay_payment_id = payload.razorpay_payment_id

    db.add(order)
    db.commit()
from decimal import Decimal, ROUND_HALF_UP

import razorpay
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import require_customer
from app.db.session import get_db
from app.models.order import Order
from app.models.user import User
from app.schemas.payment import (
    PaymentStatusResponse,
    RazorpayCreateOrderRequest,
    RazorpayCreateOrderResponse,
    RazorpayVerifyRequest,
)


router = APIRouter(prefix="/payments", tags=["payments"])


def _razorpay_client() -> razorpay.Client:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay keys not configured",
        )
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


@router.post(
    "/razorpay/create-order",
    response_model=RazorpayCreateOrderResponse,
    status_code=status.HTTP_200_OK,
)
def create_razorpay_order(
    payload: RazorpayCreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
) -> RazorpayCreateOrderResponse:
    order = db.get(Order, payload.order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )
    if order.status == "Paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Order already paid"
        )

    amount = Decimal(str(order.total_amount))
    amount_paise = int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    if amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid order amount"
        )

    client = _razorpay_client()
    rp_order = client.order.create(
        {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"dealiva_order_{order.id}",
        }
    )

    order.payment_provider = "razorpay"
    order.razorpay_order_id = rp_order.get("id")
    db.add(order)
    db.commit()

    return RazorpayCreateOrderResponse(
        key_id=settings.razorpay_key_id,
        razorpay_order_id=rp_order["id"],
        amount=rp_order["amount"],
        currency=rp_order["currency"],
    )


@router.post(
    "/razorpay/verify",
    response_model=PaymentStatusResponse,
    status_code=status.HTTP_200_OK,
)
def verify_razorpay_payment(
    payload: RazorpayVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
) -> PaymentStatusResponse:
    order = db.get(Order, payload.order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Order not found"
        )

    if not order.razorpay_order_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Razorpay order not created for this order",
        )
    if payload.razorpay_order_id != order.razorpay_order_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Razorpay order mismatch"
        )

    client = _razorpay_client()
    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": payload.razorpay_order_id,
                "razorpay_payment_id": payload.razorpay_payment_id,
                "razorpay_signature": payload.razorpay_signature,
            }
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Payment verification failed"
        )

    order.status = "Paid"
    order.payment_provider = "razorpay"
    order.razorpay_payment_id = payload.razorpay_payment_id
    order.razorpay_signature = payload.razorpay_signature
    db.add(order)
    db.commit()

    return PaymentStatusResponse(order_id=order.id, status=order.status)


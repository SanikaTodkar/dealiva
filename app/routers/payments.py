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
from app.services.order_status import enforce_transition
from app.services.payment_service import (
    create_payment_order,
    verify_payment,
    get_razorpay_client,
)


router = APIRouter(prefix="/payments", tags=["payments"])


def _razorpay_client() -> razorpay.Client:
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay keys not configured",
        )
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


@router.post("/razorpay/create-order", response_model=RazorpayCreateOrderResponse, status_code=status.HTTP_200_OK,)
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
    if order.status != "Placed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot create payment for order in '{order.status}' state",
        )

    rp_order = create_payment_order(db, order)

    return RazorpayCreateOrderResponse(
        key_id=settings.razorpay_key_id,
        razorpay_order_id=rp_order["id"],
        amount=rp_order["amount"],
        currency=rp_order["currency"],
    )


@router.post("/razorpay/verify", response_model=PaymentStatusResponse, status_code=status.HTTP_200_OK,)
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
    if order.status == "Paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order already verified as paid",
        )
    
    client = get_razorpay_client()
    verify_payment(db, order, payload, client)

    return PaymentStatusResponse(order_id=order.id, status=order.status)


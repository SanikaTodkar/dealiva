from pydantic import BaseModel, Field


class RazorpayCreateOrderRequest(BaseModel):
    order_id: int = Field(gt=0)


class RazorpayCreateOrderResponse(BaseModel):
    key_id: str
    razorpay_order_id: str
    amount: int
    currency: str


class RazorpayVerifyRequest(BaseModel):
    order_id: int = Field(gt=0)
    razorpay_order_id: str = Field(min_length=3)
    razorpay_payment_id: str = Field(min_length=3)
    razorpay_signature: str = Field(min_length=3)


class PaymentStatusResponse(BaseModel):
    order_id: int
    status: str


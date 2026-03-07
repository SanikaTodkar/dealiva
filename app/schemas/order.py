from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class OrderItemRead(BaseModel):
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class OrderRead(BaseModel):
    id: int
    user_id: int
    shop_id: int
    status: str
    total_amount: Decimal
    created_at: datetime
    items: list[OrderItemRead]


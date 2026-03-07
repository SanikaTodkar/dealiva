from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.order import OrderItemRead


class OrderShopRead(BaseModel):
    order_id: int
    customer_id: int
    items: list[OrderItemRead]
    total_amount: Decimal
    status: str


class OrderStatusUpdate(BaseModel):
    status: Literal["Ready for Pickup", "Completed"] = Field(...)


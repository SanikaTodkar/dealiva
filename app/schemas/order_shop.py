from decimal import Decimal
from pydantic import BaseModel, Field

from app.schemas.order import OrderItemRead
from app.core.enums import OrderStatus

class OrderShopRead(BaseModel):
    order_id: int
    customer_id: int
    items: list[OrderItemRead]
    total_amount: Decimal
    status: str


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class ProductRead(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    price: Decimal = Field(gt=0)
    discount_percent: int
    final_price: Decimal
    expiry_date: date | None
    stock: int = Field(ge=0)
    image_url: str | None = Field(default=None, max_length=500)


from decimal import Decimal
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    image_url: str | None = Field(default=None, max_length=500)
    price: Decimal = Field(gt=0)
    stock: int = Field(ge=0, default=0)


class ProductCreate(ProductBase):
    shop_id: int | None = Field(
        default=None, gt=0, description="Optional; derived from shop_owner if omitted"
    )
    expiry_date: date | None = Field(default=None)


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    image_url: str | None = Field(default=None, max_length=500)
    price: Decimal | None = Field(default=None, gt=0)
    stock: int | None = Field(default=None, ge=0)
    expiry_date: date | None = Field(default=None)


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    shop_id: int
    expiry_date: date | None
    discount_percent: int
    final_price: Decimal
    created_at: datetime


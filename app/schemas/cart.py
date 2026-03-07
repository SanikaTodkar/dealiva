from decimal import Decimal

from pydantic import BaseModel, Field


class CartAddRequest(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0, description="Quantity to add")


class CartRemoveRequest(BaseModel):
    product_id: int = Field(gt=0)


class CartUpdateQuantityRequest(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(ge=0, description="Set quantity. 0 removes item.")


class ShopSummary(BaseModel):
    id: int
    name: str
    address: str
    city: str


class CartItemRead(BaseModel):
    product_id: int
    name: str
    description: str | None = None
    price: Decimal
    quantity: int
    line_total: Decimal
    image_url: str | None = None


class CartRead(BaseModel):
    shop_id: int | None
    shop: ShopSummary | None = None
    items: list[CartItemRead]
    total_amount: Decimal


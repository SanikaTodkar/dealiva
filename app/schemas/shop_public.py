from pydantic import BaseModel, Field


class ShopRead(BaseModel):
    id: int
    shop_name: str = Field(min_length=1, max_length=200)
    city: str = Field(min_length=1, max_length=100)
    rating: float = 0.0


class ShopDetailRead(ShopRead):
    address: str = Field(min_length=1, max_length=500)


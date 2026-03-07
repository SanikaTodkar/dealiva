from datetime import datetime

from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    shop_id: int = Field(gt=0)
    rating: int = Field(ge=1, le=5)
    feedback: str | None = Field(default=None, max_length=1000)


class RatingRead(BaseModel):
    id: int
    shop_id: int
    user_id: int
    user_name: str
    rating: int
    feedback: str | None
    created_at: datetime


class ShopRatingItem(BaseModel):
    user_name: str
    rating: int
    feedback: str | None


class ShopRatingsResponse(BaseModel):
    average_rating: float
    total_ratings: int
    ratings: list[ShopRatingItem]


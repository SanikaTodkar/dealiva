from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ShopBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    address: str = Field(min_length=1, max_length=500)
    city: str = Field(min_length=1, max_length=100)


class ShopCreate(ShopBase):
    pass


class ShopUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    address: str | None = Field(default=None, min_length=1, max_length=500)
    city: str | None = Field(default=None, min_length=1, max_length=100)


class ShopRead(ShopBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    status: str
    is_otp_verified: bool
    created_at: datetime


class ShopOtpVerifyRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6)


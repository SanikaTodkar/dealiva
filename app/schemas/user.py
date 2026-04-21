from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.maharashtra_cities import MAHARASHTRA_CITIES


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    mobile: str
    address: str
    city: str
    is_blocked: bool
    created_at: datetime


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(default="customer")
    mobile: str = Field(min_length=10, max_length=20)
    address: str = Field(min_length=5, max_length=500)
    city: str = Field(min_length=1, max_length=100)

    @field_validator("city")
    @classmethod
    def validate_city(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in MAHARASHTRA_CITIES:
            raise ValueError("City must be in Maharashtra")
        return value.strip()


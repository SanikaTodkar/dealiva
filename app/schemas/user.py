from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    city: str
    created_at: datetime


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(default="customer")
    city: str = Field(min_length=1, max_length=100)


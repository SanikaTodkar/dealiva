from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=6, max_length=128)
    role: str | None = Field(default=None, description="Optional role check")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/dealiva_db"
    )
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()


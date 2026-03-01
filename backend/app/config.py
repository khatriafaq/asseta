from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://asseta:asseta@localhost:5432/asseta"

    # Auth
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
    ]

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # MUFAP
    mufap_base_url: str = "https://www.mufap.com.pk"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()

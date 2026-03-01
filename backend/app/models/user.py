import datetime as dt
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum

from sqlmodel import Field, SQLModel


class RiskTolerance(str, Enum):
    conservative = "conservative"
    moderate = "moderate"
    aggressive = "aggressive"


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str | None = Field(default=None)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Profile fields
    date_of_birth: dt.date | None = Field(default=None)
    risk_tolerance: RiskTolerance | None = Field(default=None)
    investment_horizon_years: int | None = Field(default=None)
    monthly_income: Decimal | None = Field(default=None)
    # Per-user Gemini API key
    gemini_api_key: str | None = Field(default=None)


class UserCreate(SQLModel):
    name: str | None = None
    email: str
    password: str


class UserRead(SQLModel):
    id: int
    name: str | None
    email: str
    created_at: datetime
    date_of_birth: dt.date | None = None
    risk_tolerance: RiskTolerance | None = None
    investment_horizon_years: int | None = None
    monthly_income: Decimal | None = None
    gemini_api_key_masked: str | None = None


class UserUpdate(SQLModel):
    name: str | None = None
    email: str | None = None
    date_of_birth: dt.date | None = None
    risk_tolerance: RiskTolerance | None = None
    investment_horizon_years: int | None = None
    monthly_income: Decimal | None = None
    gemini_api_key: str | None = None

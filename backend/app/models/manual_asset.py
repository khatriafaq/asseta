from datetime import datetime, timezone
from decimal import Decimal

from sqlmodel import Field, SQLModel


class ManualAsset(SQLModel, table=True):
    __tablename__ = "manualasset"
    id: int | None = Field(default=None, primary_key=True)
    portfolio_id: int = Field(foreign_key="portfolio.id", index=True)
    description: str
    asset_type: str = Field(default="Savings Account")
    current_balance: Decimal = Field(max_digits=18, decimal_places=2)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ManualAssetCreate(SQLModel):
    description: str
    asset_type: str = "Savings Account"
    current_balance: Decimal


class ManualAssetRead(SQLModel):
    id: int
    portfolio_id: int
    description: str
    asset_type: str
    current_balance: Decimal
    updated_at: datetime


class ManualAssetUpdate(SQLModel):
    description: str | None = None
    asset_type: str | None = None
    current_balance: Decimal | None = None

from decimal import Decimal

from sqlmodel import Field, SQLModel


class TargetAllocation(SQLModel, table=True):
    __tablename__ = "targetallocation"
    id: int | None = Field(default=None, primary_key=True)
    portfolio_id: int = Field(foreign_key="portfolio.id", index=True)
    asset_type: str  # "Equity Fund", "Money Market Fund", "Debt Fund", "Savings Account", etc.
    target_pct: Decimal = Field(max_digits=6, decimal_places=4)


class TargetAllocationRead(SQLModel):
    id: int
    portfolio_id: int
    asset_type: str
    target_pct: Decimal
    current_value: Decimal | None = None
    current_pct: Decimal | None = None
    drift_pct: Decimal | None = None


class TargetAllocationSet(SQLModel):
    asset_type: str
    target_pct: Decimal

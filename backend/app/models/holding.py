from datetime import datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class PortfolioHolding(SQLModel, table=True):
    __tablename__ = "portfolioholding"
    id: int | None = Field(default=None, primary_key=True)
    portfolio_id: int = Field(foreign_key="portfolio.id", index=True)
    fund_id: int = Field(foreign_key="fund.id", index=True)
    units_held: Decimal = Field(max_digits=18, decimal_places=4)
    total_invested: Decimal = Field(max_digits=18, decimal_places=2)
    avg_cost_per_unit: Decimal = Field(max_digits=18, decimal_places=4)
    current_value: Decimal = Field(max_digits=18, decimal_places=2)
    gain_loss: Decimal = Field(max_digits=18, decimal_places=2)
    return_pct: Decimal = Field(max_digits=10, decimal_places=4)
    updated_at: datetime


class HoldingRead(SQLModel):
    id: int
    portfolio_id: int
    fund_id: int
    units_held: Decimal
    total_invested: Decimal
    avg_cost_per_unit: Decimal
    current_value: Decimal
    gain_loss: Decimal
    return_pct: Decimal
    updated_at: datetime
    fund_name: str | None = None
    fund_type: str | None = None
    institution_name: str | None = None
    current_nav: Decimal | None = None
    nav_change: Decimal | None = None

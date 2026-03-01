from datetime import date
from decimal import Decimal

from sqlmodel import Field, SQLModel


class MonthlySnapshot(SQLModel, table=True):
    __tablename__ = "monthlysnapshot"
    id: int | None = Field(default=None, primary_key=True)
    portfolio_id: int = Field(foreign_key="portfolio.id", index=True)
    month: str  # "2025-12"
    snapshot_date: date
    total_invested: Decimal = Field(max_digits=18, decimal_places=2)
    portfolio_value: Decimal = Field(max_digits=18, decimal_places=2)
    absolute_gain: Decimal = Field(max_digits=18, decimal_places=2)
    portfolio_xirr: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    equity_pct: Decimal | None = Field(default=None, max_digits=6, decimal_places=4)
    debt_pct: Decimal | None = Field(default=None, max_digits=6, decimal_places=4)
    money_market_pct: Decimal | None = Field(default=None, max_digits=6, decimal_places=4)
    savings_pct: Decimal | None = Field(default=None, max_digits=6, decimal_places=4)
    pf_equity_pct: Decimal | None = Field(default=None, max_digits=6, decimal_places=4)
    pf_debt_pct: Decimal | None = Field(default=None, max_digits=6, decimal_places=4)
    monthly_return_pct: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    peak_value: Decimal | None = Field(default=None, max_digits=18, decimal_places=2)
    drawdown_pct: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)


class SnapshotHolding(SQLModel, table=True):
    __tablename__ = "snapshotholding"
    id: int | None = Field(default=None, primary_key=True)
    snapshot_id: int = Field(foreign_key="monthlysnapshot.id", index=True)
    fund_id: int = Field(foreign_key="fund.id")
    total_invested: Decimal = Field(max_digits=18, decimal_places=2)
    portfolio_value: Decimal = Field(max_digits=18, decimal_places=2)


class SnapshotRead(SQLModel):
    id: int
    portfolio_id: int
    month: str
    snapshot_date: date
    total_invested: Decimal
    portfolio_value: Decimal
    absolute_gain: Decimal
    portfolio_xirr: Decimal | None
    equity_pct: Decimal | None
    debt_pct: Decimal | None
    money_market_pct: Decimal | None
    savings_pct: Decimal | None
    monthly_return_pct: Decimal | None

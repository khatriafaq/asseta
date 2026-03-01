from datetime import date
from decimal import Decimal

from sqlmodel import Field, SQLModel


class DailyPortfolioValue(SQLModel, table=True):
    __tablename__ = "dailyportfoliovalue"
    id: int | None = Field(default=None, primary_key=True)
    portfolio_id: int = Field(foreign_key="portfolio.id", index=True)
    date: date
    total_invested: Decimal = Field(max_digits=18, decimal_places=2)
    portfolio_value: Decimal = Field(max_digits=18, decimal_places=2)


class DailyValueRead(SQLModel):
    date: date
    total_invested: Decimal
    portfolio_value: Decimal

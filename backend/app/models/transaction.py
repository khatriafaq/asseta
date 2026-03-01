import datetime as dt
from decimal import Decimal
from typing import Optional

from sqlmodel import Field, SQLModel


class Transaction(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    portfolio_id: int = Field(foreign_key="portfolio.id", index=True)
    fund_id: int = Field(foreign_key="fund.id", index=True)
    date: dt.date
    transaction_type: str  # "Deposit", "Withdrawal", "Profit", "Dividend"
    units: Decimal = Field(max_digits=18, decimal_places=4)
    price_per_unit: Decimal = Field(max_digits=18, decimal_places=4)
    amount: Decimal = Field(max_digits=18, decimal_places=2)
    signed_amount: Decimal = Field(max_digits=18, decimal_places=2)
    xirr_cashflow: Decimal = Field(max_digits=18, decimal_places=2)
    created_at: dt.datetime = Field(
        default_factory=lambda: dt.datetime.now(dt.timezone.utc)
    )


class TransactionCreate(SQLModel):
    fund_id: int
    date: dt.date
    transaction_type: str
    units: Decimal
    price_per_unit: Decimal
    amount: Decimal
    signed_amount: Optional[Decimal] = None
    xirr_cashflow: Optional[Decimal] = None


class TransactionRead(SQLModel):
    id: int
    portfolio_id: int
    fund_id: int
    date: dt.date
    transaction_type: str
    units: Decimal
    price_per_unit: Decimal
    amount: Decimal
    signed_amount: Decimal
    xirr_cashflow: Decimal
    created_at: dt.datetime
    fund_name: Optional[str] = None
    institution_name: Optional[str] = None


class TransactionUpdate(SQLModel):
    date: Optional[dt.date] = None
    transaction_type: Optional[str] = None
    units: Optional[Decimal] = None
    price_per_unit: Optional[Decimal] = None
    amount: Optional[Decimal] = None

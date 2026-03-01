from decimal import Decimal

from sqlmodel import Field, SQLModel


class Income(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    month: str  # "2026-01"
    source: str  # "salary", "freelance", "rental", "dividends", "profit", "business"
    amount: Decimal = Field(max_digits=18, decimal_places=2)
    is_passive: bool = Field(default=False)
    notes: str | None = None


class IncomeCreate(SQLModel):
    month: str
    source: str
    amount: Decimal
    is_passive: bool = False
    notes: str | None = None


class IncomeRead(SQLModel):
    id: int
    user_id: int
    month: str
    source: str
    amount: Decimal
    is_passive: bool
    notes: str | None


class IncomeUpdate(SQLModel):
    month: str | None = None
    source: str | None = None
    amount: Decimal | None = None
    is_passive: bool | None = None
    notes: str | None = None

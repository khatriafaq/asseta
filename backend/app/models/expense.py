from decimal import Decimal

from sqlmodel import Field, SQLModel


class Expense(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    month: str  # "2026-01"
    category: str  # "housing", "food", "transport", "utilities", "healthcare", "education", "entertainment", "zakat", "other"
    amount: Decimal = Field(max_digits=18, decimal_places=2)
    is_essential: bool = Field(default=True)
    notes: str | None = None


class ExpenseCreate(SQLModel):
    month: str
    category: str
    amount: Decimal
    is_essential: bool = True
    notes: str | None = None


class ExpenseRead(SQLModel):
    id: int
    user_id: int
    month: str
    category: str
    amount: Decimal
    is_essential: bool
    notes: str | None


class ExpenseUpdate(SQLModel):
    month: str | None = None
    category: str | None = None
    amount: Decimal | None = None
    is_essential: bool | None = None
    notes: str | None = None

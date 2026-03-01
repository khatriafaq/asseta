from datetime import date
from decimal import Decimal

from sqlmodel import Field, SQLModel


class FIProfile(SQLModel, table=True):
    __tablename__ = "fi_profile"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, index=True)
    monthly_expenses: Decimal = Field(max_digits=18, decimal_places=2)
    fi_number: Decimal | None = Field(default=None, max_digits=18, decimal_places=2)
    target_fi_date: date | None = None
    safe_withdrawal_rate: Decimal = Field(default=Decimal("0.0333"), max_digits=6, decimal_places=4)  # 30x rule — appropriate for Pakistan's higher inflation & early retirement horizon
    inflation_rate: Decimal = Field(default=Decimal("0.12"), max_digits=6, decimal_places=4)
    expected_return_rate: Decimal = Field(default=Decimal("0.15"), max_digits=6, decimal_places=4)
    fi_strategy: str = Field(default="moderate")  # "lean", "moderate", "fat"
    barista_monthly_income: Decimal | None = Field(default=None, max_digits=18, decimal_places=2)


class FIProfileRead(SQLModel):
    id: int
    user_id: int
    monthly_expenses: Decimal
    fi_number: Decimal | None
    target_fi_date: date | None
    safe_withdrawal_rate: Decimal
    inflation_rate: Decimal
    expected_return_rate: Decimal
    fi_strategy: str
    barista_monthly_income: Decimal | None


class FIProfileUpdate(SQLModel):
    monthly_expenses: Decimal | None = None
    target_fi_date: date | None = None
    safe_withdrawal_rate: Decimal | None = None
    inflation_rate: Decimal | None = None
    expected_return_rate: Decimal | None = None
    fi_strategy: str | None = None
    barista_monthly_income: Decimal | None = None

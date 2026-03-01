from decimal import Decimal

from sqlmodel import Field, SQLModel


class NetWorthSnapshot(SQLModel, table=True):
    __tablename__ = "networth_snapshot"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    month: str  # "2026-01"
    total_assets: Decimal = Field(max_digits=18, decimal_places=2)
    total_liabilities: Decimal = Field(default=Decimal("0"), max_digits=18, decimal_places=2)
    net_worth: Decimal = Field(max_digits=18, decimal_places=2)
    total_income: Decimal = Field(max_digits=18, decimal_places=2)
    total_expenses: Decimal = Field(max_digits=18, decimal_places=2)
    savings_amount: Decimal = Field(max_digits=18, decimal_places=2)
    savings_rate: Decimal = Field(max_digits=10, decimal_places=4)
    passive_income: Decimal = Field(default=Decimal("0"), max_digits=18, decimal_places=2)
    passive_income_ratio: Decimal = Field(default=Decimal("0"), max_digits=10, decimal_places=4)
    fi_progress_pct: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)


class NetWorthSnapshotRead(SQLModel):
    id: int
    user_id: int
    month: str
    total_assets: Decimal
    total_liabilities: Decimal
    net_worth: Decimal
    total_income: Decimal
    total_expenses: Decimal
    savings_amount: Decimal
    savings_rate: Decimal
    passive_income: Decimal
    passive_income_ratio: Decimal
    fi_progress_pct: Decimal | None

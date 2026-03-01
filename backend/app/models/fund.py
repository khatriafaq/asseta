from datetime import datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class FundCategory(SQLModel, table=True):
    __tablename__ = "fundcategory"
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    sector: str | None = None  # "Open-End Funds", "VPS", "ETF", etc.


class Fund(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    scheme_key: str = Field(unique=True, index=True)
    name: str = Field(index=True)
    fund_type: str  # "Equity Fund", "Money Market Fund", "Debt Fund", etc.
    category_id: int | None = Field(default=None, foreign_key="fundcategory.id")
    institution_id: int | None = Field(default=None, foreign_key="institution.id")
    rating: str | None = None
    benchmark: str | None = None
    current_nav: Decimal | None = Field(default=None, max_digits=18, decimal_places=4)
    nav_updated_at: datetime | None = None
    return_ytd: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    return_mtd: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    return_1d: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    return_15d: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    return_30d: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    return_90d: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    return_180d: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    return_270d: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    return_365d: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    return_2y: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    return_3y: Decimal | None = Field(default=None, max_digits=10, decimal_places=4)
    is_shariah_compliant: bool = Field(default=False)


class FundCreate(SQLModel):
    scheme_key: str
    name: str
    fund_type: str
    category_id: int | None = None
    institution_id: int | None = None
    is_shariah_compliant: bool = False


class FundRead(SQLModel):
    id: int
    scheme_key: str
    name: str
    fund_type: str
    category_id: int | None
    institution_id: int | None
    rating: str | None
    benchmark: str | None
    current_nav: Decimal | None
    nav_updated_at: datetime | None
    return_ytd: Decimal | None
    return_30d: Decimal | None
    return_90d: Decimal | None
    return_180d: Decimal | None
    return_365d: Decimal | None
    return_2y: Decimal | None
    return_3y: Decimal | None
    is_shariah_compliant: bool


class FundBrief(SQLModel):
    id: int
    scheme_key: str
    name: str
    fund_type: str
    current_nav: Decimal | None
    return_ytd: Decimal | None
    is_shariah_compliant: bool


class NAVHistory(SQLModel, table=True):
    __tablename__ = "navhistory"
    id: int | None = Field(default=None, primary_key=True)
    fund_id: int = Field(foreign_key="fund.id", index=True)
    date: datetime = Field(index=True)
    nav: Decimal = Field(max_digits=18, decimal_places=4)


class NAVHistoryRead(SQLModel):
    id: int
    fund_id: int
    date: datetime
    nav: Decimal

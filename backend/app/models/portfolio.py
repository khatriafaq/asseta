from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Portfolio(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    name: str
    description: str | None = None
    is_default: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PortfolioCreate(SQLModel):
    name: str
    description: str | None = None
    is_default: bool = False


class PortfolioRead(SQLModel):
    id: int
    name: str
    description: str | None
    is_default: bool
    created_at: datetime
    updated_at: datetime


class PortfolioUpdate(SQLModel):
    name: str | None = None
    description: str | None = None
    is_default: bool | None = None

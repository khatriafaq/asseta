from datetime import datetime, timezone
from decimal import Decimal

from sqlmodel import Field, SQLModel


class AlertRule(SQLModel, table=True):
    __tablename__ = "alertrule"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    fund_id: int | None = Field(default=None, foreign_key="fund.id")
    alert_type: str  # "nav_above", "nav_below", "return_above", "drawdown", "fi_milestone"
    threshold: Decimal = Field(max_digits=18, decimal_places=4)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AlertLog(SQLModel, table=True):
    __tablename__ = "alertlog"
    id: int | None = Field(default=None, primary_key=True)
    rule_id: int = Field(foreign_key="alertrule.id", index=True)
    triggered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message: str


class AlertRuleCreate(SQLModel):
    fund_id: int | None = None
    alert_type: str
    threshold: Decimal


class AlertRuleRead(SQLModel):
    id: int
    user_id: int
    fund_id: int | None
    alert_type: str
    threshold: Decimal
    is_active: bool
    created_at: datetime

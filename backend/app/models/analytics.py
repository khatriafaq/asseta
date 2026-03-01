from decimal import Decimal

from sqlmodel import SQLModel


class RebalanceRequest(SQLModel):
    amount: Decimal  # PKR amount to invest


class RebalanceSuggestionItem(SQLModel):
    asset_type: str
    suggested_amount: Decimal
    current_pct: Decimal
    target_pct: Decimal
    drift_pct: Decimal
    recommended_fund_id: int | None = None
    recommended_fund_name: str | None = None
    reasoning: str | None = None


class AIInsight(SQLModel):
    summary: str
    strengths: list[str] = []
    concerns: list[str] = []
    recommendations: list[str] = []
    market_context: str | None = None
    emergency_fund_status: str | None = None  # one-sentence EF assessment + next step
    rebalance_reasoning: dict[str, str] = {}  # asset_type -> reasoning

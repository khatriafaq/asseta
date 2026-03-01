from sqlmodel import SQLModel


class ConcentrationWarning(SQLModel):
    entity: str  # fund name or institution name
    entity_type: str  # "fund" or "institution"
    weight_pct: float
    threshold_pct: float
    message: str


class RiskScore(SQLModel):
    health_score: int  # 0-100
    diversification_grade: str  # A-F
    concentration_warnings: list[ConcentrationWarning] = []
    age_appropriate: bool | None = None  # None if no DOB set
    age_appropriate_message: str | None = None
    risk_factors: list[str] = []  # Plain English bullet points

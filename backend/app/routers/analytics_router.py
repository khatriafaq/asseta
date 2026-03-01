import datetime as dt
import logging

from fastapi import APIRouter, HTTPException

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.analytics import AIInsight, RebalanceRequest, RebalanceSuggestionItem
from app.models.risk_score import RiskScore
from app.services.analytics_service import AnalyticsService
from app.services.emergency_fund_service import EmergencyFundService
from app.services.gemini_service import GeminiService
from app.services.portfolio_service import PortfolioService
from app.services.risk_scoring_service import RiskScoringService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/portfolios/{portfolio_id}/analytics", tags=["analytics"])


@router.get("/returns")
def portfolio_returns(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)
    return AnalyticsService(session).portfolio_returns(portfolio_id)


@router.get("/allocation-drift")
def allocation_drift(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)
    return AnalyticsService(session).allocation_drift(portfolio_id)


@router.post("/rebalance-suggestion", response_model=list[RebalanceSuggestionItem])
def rebalance_suggestion(
    portfolio_id: int,
    body: RebalanceRequest,
    session: SessionDep,
    current_user: CurrentUserDep,
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)
    return AnalyticsService(session).rebalance_suggestion(
        portfolio_id, body.amount, current_user
    )


@router.get("/risk-score", response_model=RiskScore)
def risk_score(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)
    return RiskScoringService(session).calculate_risk_score(portfolio_id, current_user)


@router.post("/ai-insights", response_model=AIInsight)
def ai_insights(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    if not current_user.gemini_api_key:
        raise HTTPException(
            status_code=400,
            detail="Set your Gemini API key in Settings to unlock AI insights",
        )

    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)

    ef_service = EmergencyFundService(session)

    # Holdings tagged as emergency fund are excluded from investment analytics.
    # EF is a safety net, not an investment — including it distorts allocation
    # percentages, XIRR, and rebalancing targets.
    ef_holding_ids = ef_service.get_excluded_holding_ids(current_user.id)

    analytics = AnalyticsService(session)

    # Investable portfolio (EF excluded) — used for all investment analysis
    returns_data = analytics.portfolio_returns(portfolio_id, exclude_holding_ids=ef_holding_ids)
    drift_data = analytics.allocation_drift(portfolio_id, exclude_holding_ids=ef_holding_ids)

    # Gross portfolio (EF included) — used only for net-worth / total-assets context
    gross_returns = analytics.portfolio_returns(portfolio_id)

    portfolio_data = {
        "total_invested": float(returns_data["total_invested"]),
        "current_value": float(returns_data["current_value"]),
        "return_pct": float(returns_data["return_pct"]),
        "xirr": returns_data["xirr"],
        "allocation": drift_data,
        # Net-worth context (includes EF)
        "gross_current_value": float(gross_returns["current_value"]),
        "ef_value": float(gross_returns["current_value"]) - float(returns_data["current_value"]),
    }

    # Risk score
    risk = RiskScoringService(session).calculate_risk_score(portfolio_id, current_user)

    # User profile
    user_profile = {
        "age": (
            (dt.date.today() - current_user.date_of_birth).days // 365
            if current_user.date_of_birth
            else None
        ),
        "risk_tolerance": (
            current_user.risk_tolerance.value if current_user.risk_tolerance else None
        ),
        "investment_horizon_years": current_user.investment_horizon_years,
        "monthly_income": (
            float(current_user.monthly_income) if current_user.monthly_income else None
        ),
    }

    # Emergency fund context — from the dedicated EF service (tag-based, uses actual expense data)
    emergency_fund = ef_service.get_dashboard(current_user.id)
    # Attach the named tagged accounts so recommendations reference them specifically
    emergency_fund["tagged_accounts"] = ef_service.list_tags(current_user.id)

    try:
        gemini = GeminiService(current_user.gemini_api_key)
        return gemini.generate_portfolio_insights(portfolio_data, risk, user_profile, emergency_fund)
    except Exception as exc:
        logger.exception("Gemini API call failed")
        detail = "AI analysis temporarily unavailable. Please try again later."
        if "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc):
            detail = "Gemini API rate limit exceeded. Please wait a minute and try again."
        elif "API_KEY_INVALID" in str(exc) or "401" in str(exc):
            detail = "Invalid Gemini API key. Please check your key in Settings."
        raise HTTPException(status_code=503, detail=detail)

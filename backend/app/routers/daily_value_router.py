from fastapi import APIRouter

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.daily_value import DailyValueRead
from app.services.daily_value_service import DailyValueService
from app.services.portfolio_service import PortfolioService

router = APIRouter(prefix="/api/v1/portfolios/{portfolio_id}/daily-values", tags=["daily-values"])


@router.get("/", response_model=list[DailyValueRead])
def list_daily_values(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)
    return DailyValueService(session).list_daily_values(portfolio_id)


@router.post("/generate", response_model=DailyValueRead, status_code=201)
def generate_daily_value(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)
    return DailyValueService(session).record_daily_value(portfolio_id)


@router.post("/recalculate")
def recalculate_daily_values(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)
    fixed = DailyValueService(session).recalculate_all(portfolio_id)
    return {"fixed": fixed}

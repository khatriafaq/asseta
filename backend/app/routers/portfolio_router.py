from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, UploadFile, File

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.portfolio import PortfolioCreate, PortfolioRead, PortfolioUpdate
from app.services.portfolio_service import PortfolioService
from app.utils.excel_importer import import_excel

router = APIRouter(prefix="/api/v1/portfolios", tags=["portfolios"])


@router.get("/", response_model=list[PortfolioRead])
def list_portfolios(session: SessionDep, current_user: CurrentUserDep):
    svc = PortfolioService(session)
    return svc.list_portfolios(current_user.id)


@router.post("/", response_model=PortfolioRead, status_code=201)
def create_portfolio(
    data: PortfolioCreate, session: SessionDep, current_user: CurrentUserDep
):
    svc = PortfolioService(session)
    return svc.create_portfolio(data, current_user.id)


@router.get("/{portfolio_id}", response_model=PortfolioRead)
def get_portfolio(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    svc = PortfolioService(session)
    return svc.get_portfolio(portfolio_id, current_user.id)


@router.patch("/{portfolio_id}", response_model=PortfolioRead)
def update_portfolio(
    portfolio_id: int,
    data: PortfolioUpdate,
    session: SessionDep,
    current_user: CurrentUserDep,
):
    svc = PortfolioService(session)
    return svc.update_portfolio(portfolio_id, data, current_user.id)


@router.delete("/{portfolio_id}", status_code=204)
def delete_portfolio(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    svc = PortfolioService(session)
    svc.delete_portfolio(portfolio_id, current_user.id)


@router.get("/{portfolio_id}/summary")
def portfolio_summary(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    from app.services.analytics_service import AnalyticsService
    from app.services.emergency_fund_service import EmergencyFundService

    svc = PortfolioService(session)
    svc.get_portfolio(portfolio_id, current_user.id)  # ownership check
    ef_holding_ids = EmergencyFundService(session).get_excluded_holding_ids(current_user.id)
    analytics = AnalyticsService(session)
    return analytics.portfolio_returns(portfolio_id, exclude_holding_ids=ef_holding_ids)


@router.post("/{portfolio_id}/import")
def import_from_excel(
    portfolio_id: int,
    session: SessionDep,
    current_user: CurrentUserDep,
    file: UploadFile = File(...),
):
    svc = PortfolioService(session)
    svc.get_portfolio(portfolio_id, current_user.id)  # ownership check

    with NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        tmp.write(file.file.read())
        tmp_path = Path(tmp.name)

    try:
        result = import_excel(tmp_path, portfolio_id, session)
    finally:
        tmp_path.unlink(missing_ok=True)

    return result

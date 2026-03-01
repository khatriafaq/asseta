from fastapi import APIRouter

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.snapshot import SnapshotRead
from app.services.portfolio_service import PortfolioService
from app.services.snapshot_service import SnapshotService

router = APIRouter(prefix="/api/v1/portfolios/{portfolio_id}/snapshots", tags=["snapshots"])


@router.get("/", response_model=list[SnapshotRead])
def list_snapshots(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)
    return SnapshotService(session).list_snapshots(portfolio_id)


@router.post("/generate", response_model=SnapshotRead, status_code=201)
def generate_snapshot(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)
    return SnapshotService(session).generate_snapshot(portfolio_id)

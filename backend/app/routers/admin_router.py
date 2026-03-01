"""Admin endpoints for on-demand operations."""

from fastapi import APIRouter, status
from sqlalchemy import func
from sqlmodel import select

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.fund import Fund
from app.models.holding import PortfolioHolding
from app.scrapers.mufap_scraper import update_fund_navs

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.post("/refresh-navs", status_code=status.HTTP_200_OK)
async def refresh_navs(session: SessionDep, current_user: CurrentUserDep):
    """Trigger on-demand NAV refresh from MUFAP and recalculate all holdings."""
    # Step 1: Scrape and update NAVs
    result = await update_fund_navs(session)

    # Step 2: Recalculate all holdings using fresh NAVs
    holdings_updated = _recalculate_all_holdings(session)

    return {
        **result,
        "holdings_recalculated": holdings_updated,
    }


@router.get("/nav-status")
def get_nav_status(session: SessionDep, current_user: CurrentUserDep):
    """Return the timestamp of the most recent NAV update and how many funds have NAV data."""
    last_updated = session.exec(
        select(func.max(Fund.nav_updated_at))
    ).one()
    funds_with_nav = session.exec(
        select(func.count(Fund.id)).where(Fund.nav_updated_at.isnot(None))
    ).one()
    return {"last_updated": last_updated, "funds_with_nav": funds_with_nav}


def _recalculate_all_holdings(session) -> int:
    """Recalculate all holdings using canonical TransactionService logic."""
    from app.services.transaction_service import TransactionService

    holdings = session.exec(select(PortfolioHolding)).all()
    svc = TransactionService(session)

    pairs = set((h.portfolio_id, h.fund_id) for h in holdings)
    for portfolio_id, fund_id in pairs:
        svc._recalculate_holding(portfolio_id, fund_id)

    return len(pairs)

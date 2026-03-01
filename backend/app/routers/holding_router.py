from decimal import Decimal

from fastapi import APIRouter
from sqlalchemy import func
from sqlmodel import col, select

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.fund import Fund, NAVHistory
from app.models.holding import HoldingRead, PortfolioHolding
from app.models.institution import Institution
from app.services.portfolio_service import PortfolioService

router = APIRouter(prefix="/api/v1/portfolios/{portfolio_id}/holdings", tags=["holdings"])


@router.get("/", response_model=list[HoldingRead])
def list_holdings(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)
    holdings = list(
        session.exec(
            select(PortfolioHolding).where(PortfolioHolding.portfolio_id == portfolio_id)
        ).all()
    )
    # Pre-compute NAV day-over-day change from NAVHistory (distinct dates)
    fund_ids = {h.fund_id for h in holdings}
    nav_change_cache: dict[int, Decimal | None] = {}
    for fid in fund_ids:
        distinct_dates = (
            select(
                func.date(NAVHistory.date).label("nav_date"),
                func.max(NAVHistory.id).label("max_id"),
            )
            .where(NAVHistory.fund_id == fid)
            .group_by(func.date(NAVHistory.date))
            .order_by(func.date(NAVHistory.date).desc())
            .limit(2)
            .subquery()
        )
        recent = list(
            session.exec(
                select(NAVHistory)
                .join(distinct_dates, NAVHistory.id == distinct_dates.c.max_id)
                .order_by(col(NAVHistory.date).desc())
            ).all()
        )
        if len(recent) == 2 and recent[1].nav:
            change_pct = ((recent[0].nav - recent[1].nav) / recent[1].nav) * 100
            nav_change_cache[fid] = change_pct
        else:
            nav_change_cache[fid] = None

    result = []
    for h in holdings:
        fund = session.get(Fund, h.fund_id)
        inst = session.get(Institution, fund.institution_id) if fund and fund.institution_id else None

        # Recalculate current_value using latest NAV if available
        is_savings = fund and fund.fund_type in ("Savings Account",)
        if fund and fund.current_nav and not is_savings:
            current_value = h.units_held * fund.current_nav
            gain_loss = current_value - h.total_invested
            return_pct = (gain_loss / h.total_invested) if h.total_invested else Decimal(0)
        else:
            current_value = h.current_value
            gain_loss = h.gain_loss
            return_pct = h.return_pct

        result.append(
            HoldingRead(
                id=h.id,
                portfolio_id=h.portfolio_id,
                fund_id=h.fund_id,
                units_held=h.units_held,
                total_invested=h.total_invested,
                avg_cost_per_unit=h.avg_cost_per_unit,
                current_value=current_value,
                gain_loss=gain_loss,
                return_pct=return_pct,
                updated_at=h.updated_at,
                fund_name=fund.name if fund else None,
                fund_type=fund.fund_type if fund else None,
                institution_name=inst.name if inst else None,
                current_nav=fund.current_nav if fund and not is_savings else None,
                nav_change=nav_change_cache.get(h.fund_id) if fund and not is_savings else None,
            )
        )
    return result


@router.get("/by-institution")
def holdings_by_institution(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)
    holdings = list(
        session.exec(
            select(PortfolioHolding).where(PortfolioHolding.portfolio_id == portfolio_id)
        ).all()
    )
    groups: dict[str, dict] = {}
    for h in holdings:
        fund = session.get(Fund, h.fund_id)
        inst = session.get(Institution, fund.institution_id) if fund and fund.institution_id else None
        name = inst.name if inst else "Unknown"
        if name not in groups:
            groups[name] = {"institution": name, "total_invested": 0, "current_value": 0, "gain_loss": 0}
        groups[name]["total_invested"] += float(h.total_invested)
        groups[name]["current_value"] += float(h.current_value)
        groups[name]["gain_loss"] += float(h.gain_loss)
    return list(groups.values())


@router.get("/by-asset-type")
def holdings_by_asset_type(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)
    holdings = list(
        session.exec(
            select(PortfolioHolding).where(PortfolioHolding.portfolio_id == portfolio_id)
        ).all()
    )
    groups: dict[str, dict] = {}
    for h in holdings:
        fund = session.get(Fund, h.fund_id)
        ft = fund.fund_type if fund else "Unknown"
        if ft not in groups:
            groups[ft] = {"asset_type": ft, "total_invested": 0, "current_value": 0, "gain_loss": 0}
        groups[ft]["total_invested"] += float(h.total_invested)
        groups[ft]["current_value"] += float(h.current_value)
        groups[ft]["gain_loss"] += float(h.gain_loss)
    return list(groups.values())

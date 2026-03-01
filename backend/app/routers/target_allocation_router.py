from fastapi import APIRouter
from sqlmodel import select

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.target_allocation import (
    TargetAllocation,
    TargetAllocationRead,
    TargetAllocationSet,
)
from app.services.portfolio_service import PortfolioService

router = APIRouter(
    prefix="/api/v1/portfolios/{portfolio_id}/target-allocation",
    tags=["target-allocation"],
)


@router.get("/", response_model=list[TargetAllocationRead])
def get_target_allocation(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)
    targets = list(
        session.exec(
            select(TargetAllocation).where(TargetAllocation.portfolio_id == portfolio_id)
        ).all()
    )
    return targets


@router.put("/", response_model=list[TargetAllocationRead])
def set_target_allocation(
    portfolio_id: int,
    allocations: list[TargetAllocationSet],
    session: SessionDep,
    current_user: CurrentUserDep,
):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)

    # Delete existing
    existing = list(
        session.exec(
            select(TargetAllocation).where(TargetAllocation.portfolio_id == portfolio_id)
        ).all()
    )
    for ta in existing:
        session.delete(ta)
    session.commit()

    # Create new
    result = []
    for a in allocations:
        ta = TargetAllocation(
            portfolio_id=portfolio_id,
            asset_type=a.asset_type,
            target_pct=a.target_pct,
        )
        session.add(ta)
        session.commit()
        session.refresh(ta)
        result.append(ta)
    return result

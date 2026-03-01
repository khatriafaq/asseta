from fastapi import APIRouter, HTTPException, status

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.fund import Fund, FundBrief, FundCreate, FundRead, NAVHistoryRead
from app.services.fund_service import FundService

router = APIRouter(prefix="/api/v1/funds", tags=["funds"])


@router.get("/", response_model=list[FundBrief])
def list_funds(
    session: SessionDep,
    q: str | None = None,
    fund_type: str | None = None,
    category_id: int | None = None,
    shariah_only: bool = False,
    limit: int = 50,
    offset: int = 0,
):
    svc = FundService(session)
    return svc.search_funds(
        query=q,
        fund_type=fund_type,
        category_id=category_id,
        shariah_only=shariah_only,
        limit=limit,
        offset=offset,
    )


@router.post("/", response_model=FundBrief, status_code=status.HTTP_201_CREATED)
def create_fund(
    payload: FundCreate,
    session: SessionDep,
    current_user: CurrentUserDep,
):
    svc = FundService(session)
    existing = svc.get_fund_by_scheme_key(payload.scheme_key)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Fund with scheme_key '{payload.scheme_key}' already exists",
        )
    fund = Fund.model_validate(payload)
    return svc.create_fund(fund)


@router.get("/categories")
def list_categories(session: SessionDep):
    svc = FundService(session)
    return svc.list_categories()


@router.get("/top-performers", response_model=list[FundBrief])
def top_performers(
    session: SessionDep,
    period: str = "return_ytd",
    limit: int = 20,
):
    svc = FundService(session)
    return svc.get_top_performers(period=period, limit=limit)


@router.get("/shariah-compliant", response_model=list[FundBrief])
def shariah_compliant(session: SessionDep, limit: int = 50, offset: int = 0):
    svc = FundService(session)
    return svc.get_shariah_compliant(limit=limit, offset=offset)


@router.get("/{fund_id}", response_model=FundRead)
def get_fund(fund_id: int, session: SessionDep):
    svc = FundService(session)
    fund = svc.get_fund(fund_id)
    if not fund:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fund not found")
    return fund


@router.get("/{fund_id}/nav-history", response_model=list[NAVHistoryRead])
def nav_history(fund_id: int, session: SessionDep, limit: int = 365):
    svc = FundService(session)
    return svc.get_nav_history(fund_id, limit=limit)

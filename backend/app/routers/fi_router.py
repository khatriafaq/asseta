from decimal import Decimal

from fastapi import APIRouter

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.fi_profile import FIProfileRead, FIProfileUpdate
from app.models.networth_snapshot import NetWorthSnapshotRead
from app.services.fi_service import FIService

router = APIRouter(prefix="/api/v1/fi", tags=["financial-independence"])


# --- FI Profile ---


@router.get("/profile", response_model=FIProfileRead | None)
def get_fi_profile(session: SessionDep, current_user: CurrentUserDep):
    return FIService(session).get_profile(current_user.id)


@router.put("/profile", response_model=FIProfileRead)
def upsert_fi_profile(
    data: FIProfileUpdate, session: SessionDep, current_user: CurrentUserDep
):
    return FIService(session).upsert_profile(current_user.id, data)


# --- Dashboard ---


@router.get("/dashboard")
def fi_dashboard(session: SessionDep, current_user: CurrentUserDep):
    return FIService(session).get_dashboard(current_user.id)


# --- Net Worth ---


@router.get("/networth", response_model=list[NetWorthSnapshotRead])
def list_networth(session: SessionDep, current_user: CurrentUserDep):
    return FIService(session).list_networth(current_user.id)


@router.post("/networth/generate", response_model=NetWorthSnapshotRead, status_code=201)
def generate_networth(session: SessionDep, current_user: CurrentUserDep):
    return FIService(session).generate_networth_snapshot(current_user.id)


# --- Projection ---


@router.get("/projection")
def fi_projection(session: SessionDep, current_user: CurrentUserDep):
    return FIService(session).get_projection(current_user.id)


@router.get("/what-if")
def fi_what_if(
    session: SessionDep,
    current_user: CurrentUserDep,
    monthly_savings: Decimal | None = None,
    expected_return: Decimal | None = None,
    inflation: Decimal | None = None,
):
    return FIService(session).get_what_if(
        current_user.id,
        monthly_savings=monthly_savings,
        expected_return=expected_return,
        inflation=inflation,
    )

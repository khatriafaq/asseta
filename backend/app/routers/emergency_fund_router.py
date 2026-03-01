from fastapi import APIRouter

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.emergency_fund import (
    EmergencyFundConfigRead,
    EmergencyFundConfigUpdate,
    EmergencyFundTagCreate,
)
from app.services.emergency_fund_service import EmergencyFundService

router = APIRouter(prefix="/api/v1/emergency-fund", tags=["emergency-fund"])


@router.get("/config", response_model=EmergencyFundConfigRead | None)
def get_config(session: SessionDep, current_user: CurrentUserDep):
    return EmergencyFundService(session).get_config(current_user.id)


@router.put("/config", response_model=EmergencyFundConfigRead)
def upsert_config(
    data: EmergencyFundConfigUpdate, session: SessionDep, current_user: CurrentUserDep
):
    return EmergencyFundService(session).upsert_config(current_user.id, data)


@router.get("/dashboard")
def get_dashboard(session: SessionDep, current_user: CurrentUserDep):
    return EmergencyFundService(session).get_dashboard(current_user.id)


@router.get("/taggable")
def get_taggable(session: SessionDep, current_user: CurrentUserDep):
    return EmergencyFundService(session).get_taggable_items(current_user.id)


@router.post("/tags", status_code=201)
def add_tag(
    data: EmergencyFundTagCreate, session: SessionDep, current_user: CurrentUserDep
):
    return EmergencyFundService(session).add_tag(current_user.id, data)


@router.delete("/tags/{tag_id}", status_code=204)
def remove_tag(tag_id: int, session: SessionDep, current_user: CurrentUserDep):
    EmergencyFundService(session).remove_tag(current_user.id, tag_id)

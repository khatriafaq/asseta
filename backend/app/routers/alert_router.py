from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.alert import AlertRule, AlertRuleCreate, AlertRuleRead

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertRuleRead])
def list_alerts(session: SessionDep, current_user: CurrentUserDep):
    rules = list(
        session.exec(
            select(AlertRule).where(AlertRule.user_id == current_user.id)
        ).all()
    )
    return rules


@router.post("/", response_model=AlertRuleRead, status_code=201)
def create_alert(
    data: AlertRuleCreate, session: SessionDep, current_user: CurrentUserDep
):
    rule = AlertRule(user_id=current_user.id, **data.model_dump())
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


@router.patch("/{alert_id}", response_model=AlertRuleRead)
def update_alert(
    alert_id: int, data: AlertRuleCreate, session: SessionDep, current_user: CurrentUserDep
):
    rule = session.exec(
        select(AlertRule).where(
            AlertRule.id == alert_id, AlertRule.user_id == current_user.id
        )
    ).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)
    session.add(rule)
    session.commit()
    session.refresh(rule)
    return rule


@router.delete("/{alert_id}", status_code=204)
def delete_alert(
    alert_id: int, session: SessionDep, current_user: CurrentUserDep
):
    rule = session.exec(
        select(AlertRule).where(
            AlertRule.id == alert_id, AlertRule.user_id == current_user.id
        )
    ).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    session.delete(rule)
    session.commit()

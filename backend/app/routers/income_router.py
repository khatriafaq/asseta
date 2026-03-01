from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.income import Income, IncomeCreate, IncomeRead, IncomeUpdate

router = APIRouter(prefix="/api/v1/fi/income", tags=["income"])


@router.get("/", response_model=list[IncomeRead])
def list_income(
    session: SessionDep,
    current_user: CurrentUserDep,
    month: str | None = None,
):
    stmt = select(Income).where(Income.user_id == current_user.id)
    if month:
        stmt = stmt.where(Income.month == month)
    return list(session.exec(stmt.order_by(Income.month.desc())).all())


@router.post("/", response_model=IncomeRead, status_code=201)
def create_income(
    data: IncomeCreate, session: SessionDep, current_user: CurrentUserDep
):
    income = Income(user_id=current_user.id, **data.model_dump())
    session.add(income)
    session.commit()
    session.refresh(income)
    return income


@router.patch("/{income_id}", response_model=IncomeRead)
def update_income(
    income_id: int,
    data: IncomeUpdate,
    session: SessionDep,
    current_user: CurrentUserDep,
):
    income = session.exec(
        select(Income).where(Income.id == income_id, Income.user_id == current_user.id)
    ).first()
    if not income:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(income, key, value)
    session.add(income)
    session.commit()
    session.refresh(income)
    return income


@router.delete("/{income_id}", status_code=204)
def delete_income(
    income_id: int, session: SessionDep, current_user: CurrentUserDep
):
    income = session.exec(
        select(Income).where(Income.id == income_id, Income.user_id == current_user.id)
    ).first()
    if not income:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Income not found")
    session.delete(income)
    session.commit()

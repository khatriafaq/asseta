from decimal import Decimal

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.expense import Expense, ExpenseCreate, ExpenseRead, ExpenseUpdate

router = APIRouter(prefix="/api/v1/fi/expenses", tags=["expenses"])


@router.get("/", response_model=list[ExpenseRead])
def list_expenses(
    session: SessionDep,
    current_user: CurrentUserDep,
    month: str | None = None,
    category: str | None = None,
):
    stmt = select(Expense).where(Expense.user_id == current_user.id)
    if month:
        stmt = stmt.where(Expense.month == month)
    if category:
        stmt = stmt.where(Expense.category == category)
    return list(session.exec(stmt.order_by(Expense.month.desc())).all())


@router.post("/", response_model=ExpenseRead, status_code=201)
def create_expense(
    data: ExpenseCreate, session: SessionDep, current_user: CurrentUserDep
):
    expense = Expense(user_id=current_user.id, **data.model_dump())
    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense


@router.patch("/{expense_id}", response_model=ExpenseRead)
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    session: SessionDep,
    current_user: CurrentUserDep,
):
    expense = session.exec(
        select(Expense).where(
            Expense.id == expense_id, Expense.user_id == current_user.id
        )
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(expense, key, value)
    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int, session: SessionDep, current_user: CurrentUserDep
):
    expense = session.exec(
        select(Expense).where(
            Expense.id == expense_id, Expense.user_id == current_user.id
        )
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    session.delete(expense)
    session.commit()


@router.get("/summary")
def expense_summary(
    session: SessionDep,
    current_user: CurrentUserDep,
    month: str | None = None,
):
    stmt = select(Expense).where(Expense.user_id == current_user.id)
    if month:
        stmt = stmt.where(Expense.month == month)
    expenses = list(session.exec(stmt).all())

    by_category: dict[str, dict] = {}
    for e in expenses:
        if e.category not in by_category:
            by_category[e.category] = {
                "category": e.category,
                "total": Decimal("0"),
                "essential": Decimal("0"),
                "discretionary": Decimal("0"),
            }
        by_category[e.category]["total"] += e.amount
        if e.is_essential:
            by_category[e.category]["essential"] += e.amount
        else:
            by_category[e.category]["discretionary"] += e.amount

    total = sum(e.amount for e in expenses)
    return {
        "total": total,
        "by_category": list(by_category.values()),
    }

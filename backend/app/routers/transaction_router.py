from fastapi import APIRouter

from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.fund import Fund
from app.models.institution import Institution
from app.models.transaction import TransactionCreate, TransactionRead, TransactionUpdate
from app.services.portfolio_service import PortfolioService
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/api/v1/portfolios/{portfolio_id}/transactions", tags=["transactions"])


def _check_ownership(portfolio_id: int, session: SessionDep, current_user: CurrentUserDep):
    PortfolioService(session).get_portfolio(portfolio_id, current_user.id)


def _enrich(txns, session) -> list[TransactionRead]:
    fund_cache: dict[int, Fund | None] = {}
    inst_cache: dict[int, Institution | None] = {}
    result = []
    for t in txns:
        if t.fund_id not in fund_cache:
            fund_cache[t.fund_id] = session.get(Fund, t.fund_id)
        fund = fund_cache[t.fund_id]
        inst = None
        if fund and fund.institution_id:
            if fund.institution_id not in inst_cache:
                inst_cache[fund.institution_id] = session.get(Institution, fund.institution_id)
            inst = inst_cache[fund.institution_id]
        result.append(TransactionRead(
            **t.model_dump(),
            fund_name=fund.name if fund else None,
            institution_name=inst.name if inst else None,
        ))
    return result


@router.get("/", response_model=list[TransactionRead])
def list_transactions(
    portfolio_id: int, session: SessionDep, current_user: CurrentUserDep
):
    _check_ownership(portfolio_id, session, current_user)
    txns = TransactionService(session).list_transactions(portfolio_id)
    return _enrich(txns, session)


@router.post("/", response_model=TransactionRead, status_code=201)
def create_transaction(
    portfolio_id: int,
    data: TransactionCreate,
    session: SessionDep,
    current_user: CurrentUserDep,
):
    _check_ownership(portfolio_id, session, current_user)
    return TransactionService(session).create_transaction(data, portfolio_id)


@router.patch("/{txn_id}", response_model=TransactionRead)
def update_transaction(
    portfolio_id: int,
    txn_id: int,
    data: TransactionUpdate,
    session: SessionDep,
    current_user: CurrentUserDep,
):
    _check_ownership(portfolio_id, session, current_user)
    return TransactionService(session).update_transaction(txn_id, data, portfolio_id)


@router.delete("/{txn_id}", status_code=204)
def delete_transaction(
    portfolio_id: int,
    txn_id: int,
    session: SessionDep,
    current_user: CurrentUserDep,
):
    _check_ownership(portfolio_id, session, current_user)
    TransactionService(session).delete_transaction(txn_id, portfolio_id)


@router.post("/bulk", response_model=list[TransactionRead], status_code=201)
def bulk_create(
    portfolio_id: int,
    transactions: list[TransactionCreate],
    session: SessionDep,
    current_user: CurrentUserDep,
):
    _check_ownership(portfolio_id, session, current_user)
    return TransactionService(session).bulk_create(transactions, portfolio_id)

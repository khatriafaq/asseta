from sqlmodel import Session, select

from app.models.transaction import Transaction
from app.repositories.base_repository import BaseRepository


class TransactionRepository(BaseRepository[Transaction]):
    def __init__(self, session: Session):
        super().__init__(Transaction, session)

    def list_by_portfolio(self, portfolio_id: int) -> list[Transaction]:
        return list(
            self.session.exec(
                select(Transaction)
                .where(Transaction.portfolio_id == portfolio_id)
                .order_by(Transaction.date.desc())
            ).all()
        )

    def get_by_id_and_portfolio(
        self, txn_id: int, portfolio_id: int
    ) -> Transaction | None:
        return self.session.exec(
            select(Transaction).where(
                Transaction.id == txn_id,
                Transaction.portfolio_id == portfolio_id,
            )
        ).first()

    def list_by_fund_and_portfolio(
        self, fund_id: int, portfolio_id: int
    ) -> list[Transaction]:
        return list(
            self.session.exec(
                select(Transaction)
                .where(
                    Transaction.portfolio_id == portfolio_id,
                    Transaction.fund_id == fund_id,
                )
                .order_by(Transaction.date)
            ).all()
        )

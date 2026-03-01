from sqlmodel import Session, select

from app.models.portfolio import Portfolio
from app.repositories.base_repository import BaseRepository


class PortfolioRepository(BaseRepository[Portfolio]):
    def __init__(self, session: Session):
        super().__init__(Portfolio, session)

    def list_by_user(self, user_id: int) -> list[Portfolio]:
        return list(
            self.session.exec(
                select(Portfolio).where(Portfolio.user_id == user_id)
            ).all()
        )

    def get_by_id_and_user(self, portfolio_id: int, user_id: int) -> Portfolio | None:
        return self.session.exec(
            select(Portfolio).where(
                Portfolio.id == portfolio_id, Portfolio.user_id == user_id
            )
        ).first()

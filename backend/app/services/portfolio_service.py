from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import Session

from app.models.portfolio import Portfolio, PortfolioCreate, PortfolioUpdate
from app.repositories.portfolio_repo import PortfolioRepository


class PortfolioService:
    def __init__(self, session: Session):
        self.repo = PortfolioRepository(session)
        self.session = session

    def list_portfolios(self, user_id: int) -> list[Portfolio]:
        return self.repo.list_by_user(user_id)

    def get_portfolio(self, portfolio_id: int, user_id: int) -> Portfolio:
        portfolio = self.repo.get_by_id_and_user(portfolio_id, user_id)
        if not portfolio:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
        return portfolio

    def create_portfolio(self, data: PortfolioCreate, user_id: int) -> Portfolio:
        portfolio = Portfolio(user_id=user_id, **data.model_dump())
        return self.repo.create(portfolio)

    def update_portfolio(
        self, portfolio_id: int, data: PortfolioUpdate, user_id: int
    ) -> Portfolio:
        portfolio = self.get_portfolio(portfolio_id, user_id)
        update_data = data.model_dump(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc)
        return self.repo.update(portfolio, update_data)

    def delete_portfolio(self, portfolio_id: int, user_id: int) -> None:
        portfolio = self.get_portfolio(portfolio_id, user_id)
        self.repo.delete(portfolio)

from sqlmodel import Session, select

from app.models.holding import PortfolioHolding
from app.repositories.base_repository import BaseRepository


class HoldingRepository(BaseRepository[PortfolioHolding]):
    def __init__(self, session: Session):
        super().__init__(PortfolioHolding, session)

    def list_by_portfolio(self, portfolio_id: int) -> list[PortfolioHolding]:
        return list(
            self.session.exec(
                select(PortfolioHolding).where(
                    PortfolioHolding.portfolio_id == portfolio_id
                )
            ).all()
        )

    def get_by_fund(
        self, portfolio_id: int, fund_id: int
    ) -> PortfolioHolding | None:
        return self.session.exec(
            select(PortfolioHolding).where(
                PortfolioHolding.portfolio_id == portfolio_id,
                PortfolioHolding.fund_id == fund_id,
            )
        ).first()

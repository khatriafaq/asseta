from sqlmodel import Session

from app.models.fund import Fund, FundCategory, NAVHistory
from app.repositories.fund_repo import FundRepository, NAVHistoryRepository


class FundService:
    def __init__(self, session: Session):
        self.repo = FundRepository(session)
        self.nav_repo = NAVHistoryRepository(session)

    def search_funds(
        self,
        query: str | None = None,
        fund_type: str | None = None,
        category_id: int | None = None,
        shariah_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Fund]:
        return self.repo.search(
            query=query,
            fund_type=fund_type,
            category_id=category_id,
            shariah_only=shariah_only,
            limit=limit,
            offset=offset,
        )

    def create_fund(self, fund: Fund) -> Fund:
        return self.repo.create(fund)

    def get_fund(self, fund_id: int) -> Fund | None:
        return self.repo.get_by_id(fund_id)

    def get_fund_by_scheme_key(self, scheme_key: str) -> Fund | None:
        return self.repo.get_by_scheme_key(scheme_key)

    def get_nav_history(self, fund_id: int, limit: int = 365) -> list[NAVHistory]:
        return self.nav_repo.list_by_fund(fund_id, limit=limit)

    def list_categories(self) -> list[FundCategory]:
        return self.repo.list_categories()

    def get_top_performers(
        self, period: str = "return_ytd", limit: int = 20
    ) -> list[Fund]:
        return self.repo.get_top_performers(period=period, limit=limit)

    def get_shariah_compliant(self, limit: int = 50, offset: int = 0) -> list[Fund]:
        return self.repo.search(shariah_only=True, limit=limit, offset=offset)

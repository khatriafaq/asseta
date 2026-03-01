from sqlmodel import Session, select

from app.models.fund import Fund, FundCategory, NAVHistory
from app.repositories.base_repository import BaseRepository


class FundRepository(BaseRepository[Fund]):
    def __init__(self, session: Session):
        super().__init__(Fund, session)

    def get_by_scheme_key(self, scheme_key: str) -> Fund | None:
        return self.session.exec(
            select(Fund).where(Fund.scheme_key == scheme_key)
        ).first()

    def search(
        self,
        query: str | None = None,
        fund_type: str | None = None,
        category_id: int | None = None,
        shariah_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> list[Fund]:
        stmt = select(Fund)
        if query:
            stmt = stmt.where(Fund.name.ilike(f"%{query}%"))
        if fund_type:
            stmt = stmt.where(Fund.fund_type == fund_type)
        if category_id:
            stmt = stmt.where(Fund.category_id == category_id)
        if shariah_only:
            stmt = stmt.where(Fund.is_shariah_compliant == True)  # noqa: E712
        return list(self.session.exec(stmt.offset(offset).limit(limit)).all())

    def get_top_performers(self, period: str = "return_ytd", limit: int = 20) -> list[Fund]:
        col = getattr(Fund, period, Fund.return_ytd)
        return list(
            self.session.exec(
                select(Fund).where(col.isnot(None)).order_by(col.desc()).limit(limit)
            ).all()
        )

    def list_categories(self) -> list[FundCategory]:
        return list(self.session.exec(select(FundCategory)).all())


class NAVHistoryRepository(BaseRepository[NAVHistory]):
    def __init__(self, session: Session):
        super().__init__(NAVHistory, session)

    def list_by_fund(self, fund_id: int, limit: int = 365) -> list[NAVHistory]:
        return list(
            self.session.exec(
                select(NAVHistory)
                .where(NAVHistory.fund_id == fund_id)
                .order_by(NAVHistory.date.desc())
                .limit(limit)
            ).all()
        )

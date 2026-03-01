from datetime import date
from decimal import Decimal

from sqlmodel import Session, select

from app.models.daily_value import DailyPortfolioValue
from app.models.holding import PortfolioHolding
from app.models.manual_asset import ManualAsset


class DailyValueService:
    def __init__(self, session: Session):
        self.session = session

    def list_daily_values(self, portfolio_id: int) -> list[DailyPortfolioValue]:
        return list(
            self.session.exec(
                select(DailyPortfolioValue)
                .where(DailyPortfolioValue.portfolio_id == portfolio_id)
                .order_by(DailyPortfolioValue.date)
            ).all()
        )

    def record_daily_value(self, portfolio_id: int) -> DailyPortfolioValue:
        today = date.today()

        holdings = list(
            self.session.exec(
                select(PortfolioHolding).where(
                    PortfolioHolding.portfolio_id == portfolio_id
                )
            ).all()
        )

        total_invested = sum(h.total_invested for h in holdings)
        portfolio_value = sum(h.current_value for h in holdings)

        # Upsert: replace existing record for today
        existing = self.session.exec(
            select(DailyPortfolioValue).where(
                DailyPortfolioValue.portfolio_id == portfolio_id,
                DailyPortfolioValue.date == today,
            )
        ).first()

        if existing:
            existing.total_invested = total_invested
            existing.portfolio_value = portfolio_value
            self.session.add(existing)
            self.session.commit()
            self.session.refresh(existing)
            return existing

        record = DailyPortfolioValue(
            portfolio_id=portfolio_id,
            date=today,
            total_invested=total_invested,
            portfolio_value=portfolio_value,
        )
        self.session.add(record)
        self.session.commit()
        self.session.refresh(record)
        return record

    def recalculate_all(self, portfolio_id: int) -> int:
        """Subtract current manual asset balances from all existing records.

        Fixes records that were incorrectly written with manual assets included.
        Returns the number of records updated.
        """
        manual_assets = list(
            self.session.exec(
                select(ManualAsset).where(ManualAsset.portfolio_id == portfolio_id)
            ).all()
        )
        manual_total = sum(a.current_balance for a in manual_assets)
        if manual_total == 0:
            return 0

        records = list(
            self.session.exec(
                select(DailyPortfolioValue).where(
                    DailyPortfolioValue.portfolio_id == portfolio_id
                )
            ).all()
        )
        for r in records:
            r.portfolio_value = max(Decimal("0"), r.portfolio_value - manual_total)
            self.session.add(r)
        self.session.commit()
        return len(records)

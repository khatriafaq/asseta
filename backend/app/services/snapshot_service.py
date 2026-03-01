from datetime import date, timedelta
from decimal import Decimal

from sqlmodel import Session, select

from app.models.emergency_fund import EmergencyFundTag
from app.models.fund import Fund
from app.models.holding import PortfolioHolding
from app.models.manual_asset import ManualAsset
from app.models.portfolio import Portfolio
from app.models.snapshot import MonthlySnapshot, SnapshotHolding
from app.models.transaction import Transaction
from app.utils.financial_math import calculate_xirr


class SnapshotService:
    def __init__(self, session: Session):
        self.session = session

    def list_snapshots(self, portfolio_id: int) -> list[MonthlySnapshot]:
        return list(
            self.session.exec(
                select(MonthlySnapshot)
                .where(MonthlySnapshot.portfolio_id == portfolio_id)
                .order_by(MonthlySnapshot.snapshot_date.desc())
            ).all()
        )

    def _get_ef_holding_ids(self, portfolio_id: int) -> set[int]:
        """Return holding IDs tagged as emergency fund for this portfolio."""
        portfolio = self.session.get(Portfolio, portfolio_id)
        if not portfolio:
            return set()
        tags = list(
            self.session.exec(
                select(EmergencyFundTag).where(
                    EmergencyFundTag.user_id == portfolio.user_id
                )
            ).all()
        )
        return {t.holding_id for t in tags if t.holding_id is not None}

    def generate_snapshot(self, portfolio_id: int, target_date: date | None = None) -> MonthlySnapshot:
        today = target_date or date.today()
        month_str = today.strftime("%Y-%m")

        # Check for existing snapshot this month
        existing = self.session.exec(
            select(MonthlySnapshot).where(
                MonthlySnapshot.portfolio_id == portfolio_id,
                MonthlySnapshot.month == month_str,
            )
        ).first()
        if existing:
            self.session.delete(existing)
            self.session.commit()

        all_holdings = list(
            self.session.exec(
                select(PortfolioHolding).where(
                    PortfolioHolding.portfolio_id == portfolio_id
                )
            ).all()
        )

        # Exclude EF-tagged holdings from investable portfolio stats
        ef_ids = self._get_ef_holding_ids(portfolio_id)
        holdings = [h for h in all_holdings if h.id not in ef_ids]
        ef_fund_ids = {h.fund_id for h in all_holdings if h.id in ef_ids}

        total_invested = sum(h.total_invested for h in holdings)
        portfolio_value = sum(h.current_value for h in holdings)

        absolute_gain = portfolio_value - total_invested

        # XIRR — exclude EF transactions
        txns = list(
            self.session.exec(
                select(Transaction)
                .where(Transaction.portfolio_id == portfolio_id)
                .order_by(Transaction.date)
            ).all()
        )
        if ef_fund_ids:
            txns = [t for t in txns if t.fund_id not in ef_fund_ids]
        xirr_val = None
        if txns:
            dates = [t.date for t in txns] + [today]
            cfs = [float(t.xirr_cashflow) for t in txns] + [float(portfolio_value)]
            xirr_val = calculate_xirr(dates, cfs)

        # Allocation percentages
        type_values: dict[str, Decimal] = {}
        for h in holdings:
            fund = self.session.get(Fund, h.fund_id)
            if fund:
                type_values[fund.fund_type] = (
                    type_values.get(fund.fund_type, Decimal("0")) + h.current_value
                )
        tv = portfolio_value if portfolio_value else Decimal("1")

        # Get previous snapshot for monthly return
        prev = self.session.exec(
            select(MonthlySnapshot)
            .where(
                MonthlySnapshot.portfolio_id == portfolio_id,
                MonthlySnapshot.month < month_str,
            )
            .order_by(MonthlySnapshot.snapshot_date.desc())
        ).first()

        monthly_return = None
        if prev and prev.portfolio_value:
            monthly_return = (portfolio_value - prev.portfolio_value) / prev.portfolio_value

        # Peak / drawdown
        all_snaps = list(
            self.session.exec(
                select(MonthlySnapshot)
                .where(MonthlySnapshot.portfolio_id == portfolio_id)
                .order_by(MonthlySnapshot.snapshot_date)
            ).all()
        )
        peak = max((s.portfolio_value for s in all_snaps), default=portfolio_value)
        peak = max(peak, portfolio_value)
        drawdown = (portfolio_value - peak) / peak if peak else None

        snapshot = MonthlySnapshot(
            portfolio_id=portfolio_id,
            month=month_str,
            snapshot_date=today,
            total_invested=total_invested,
            portfolio_value=portfolio_value,
            absolute_gain=absolute_gain,
            portfolio_xirr=Decimal(str(xirr_val)) if xirr_val is not None else None,
            equity_pct=type_values.get("Equity Fund", Decimal("0")) / tv,
            debt_pct=type_values.get("Debt Fund", Decimal("0")) / tv,
            money_market_pct=type_values.get("Money Market Fund", Decimal("0")) / tv,
            savings_pct=type_values.get("Savings Account", Decimal("0")) / tv,
            pf_equity_pct=type_values.get("Pension Fund - Equity", Decimal("0")) / tv,
            pf_debt_pct=type_values.get("Pension Fund - Debt", Decimal("0")) / tv,
            monthly_return_pct=monthly_return,
            peak_value=peak,
            drawdown_pct=drawdown,
        )
        self.session.add(snapshot)
        self.session.commit()
        self.session.refresh(snapshot)

        # Snapshot holdings
        for h in holdings:
            sh = SnapshotHolding(
                snapshot_id=snapshot.id,
                fund_id=h.fund_id,
                total_invested=h.total_invested,
                portfolio_value=h.current_value,
            )
            self.session.add(sh)
        self.session.commit()

        return snapshot

from datetime import date, datetime, timezone
from decimal import Decimal

from sqlmodel import Session, select

from app.models.fund import Fund
from app.models.holding import PortfolioHolding
from app.models.manual_asset import ManualAsset
from app.models.target_allocation import TargetAllocation
from app.models.transaction import Transaction
from app.models.user import User
from app.utils.financial_math import calculate_xirr

EQUITY_TYPES = {"Equity Fund", "Equity"}
DEBT_TYPES = {"Debt Fund", "Debt"}
MONEY_MARKET_TYPES = {"Money Market Fund", "Money Market"}


class AnalyticsService:
    def __init__(self, session: Session):
        self.session = session

    def _live_value(self, h: PortfolioHolding) -> Decimal:
        """Return units_held × current_nav when available, else fall back to stored value."""
        fund = self.session.get(Fund, h.fund_id)
        if fund and fund.current_nav and fund.fund_type not in ("Savings Account",):
            return h.units_held * fund.current_nav
        return h.current_value

    def portfolio_returns(
        self,
        portfolio_id: int,
        exclude_holding_ids: set[int] | None = None,
    ) -> dict:
        exclude = exclude_holding_ids or set()
        all_holdings = list(
            self.session.exec(
                select(PortfolioHolding).where(
                    PortfolioHolding.portfolio_id == portfolio_id
                )
            ).all()
        )
        holdings = [h for h in all_holdings if h.id not in exclude]
        excluded_fund_ids = {h.fund_id for h in all_holdings if h.id in exclude}

        total_invested = sum(h.total_invested for h in holdings)
        current_value = sum(self._live_value(h) for h in holdings)
        absolute_gain = current_value - total_invested
        return_pct = (absolute_gain / total_invested) if total_invested else Decimal("0")

        # XIRR — exclude transactions belonging to EF-tagged funds
        txns = list(
            self.session.exec(
                select(Transaction)
                .where(Transaction.portfolio_id == portfolio_id)
                .order_by(Transaction.date)
            ).all()
        )
        if excluded_fund_ids:
            txns = [t for t in txns if t.fund_id not in excluded_fund_ids]

        xirr_value = None
        if txns:
            dates = [t.date for t in txns]
            cashflows = [float(t.xirr_cashflow) for t in txns]
            dates.append(date.today())
            cashflows.append(float(current_value))
            xirr_value = calculate_xirr(dates, cashflows)

        return {
            "total_invested": total_invested,
            "current_value": current_value,
            "absolute_gain": absolute_gain,
            "return_pct": return_pct,
            "xirr": xirr_value,
        }

    def allocation_drift(
        self,
        portfolio_id: int,
        exclude_holding_ids: set[int] | None = None,
    ) -> list[dict]:
        exclude = exclude_holding_ids or set()
        all_holdings = list(
            self.session.exec(
                select(PortfolioHolding).where(
                    PortfolioHolding.portfolio_id == portfolio_id
                )
            ).all()
        )
        holdings = [h for h in all_holdings if h.id not in exclude]
        targets = list(
            self.session.exec(
                select(TargetAllocation).where(
                    TargetAllocation.portfolio_id == portfolio_id
                )
            ).all()
        )

        total_value = sum(self._live_value(h) for h in holdings)
        if not total_value:
            return []

        type_values: dict[str, Decimal] = {}
        for h in holdings:
            fund = self.session.get(Fund, h.fund_id)
            if fund:
                ft = fund.fund_type
                type_values[ft] = type_values.get(ft, Decimal("0")) + self._live_value(h)

        # Determine which asset types belong exclusively to excluded (EF) holdings.
        # These types should be dropped from the target map — their "target" is
        # fulfilled by the Emergency Fund, not the investable portfolio.
        ef_asset_types: set[str] = set()
        for h in all_holdings:
            if h.id in exclude:
                fund = self.session.get(Fund, h.fund_id)
                if fund:
                    ef_asset_types.add(fund.fund_type)
        # Only treat a type as EF-only if it has no remaining investable holdings
        ef_asset_types = {t for t in ef_asset_types if t not in type_values}

        target_map = {
            t.asset_type: t.target_pct
            for t in targets
            if t.asset_type not in ef_asset_types
        }
        result = []
        for asset_type in set(list(type_values.keys()) + list(target_map.keys())):
            current_val = type_values.get(asset_type, Decimal("0"))
            current_pct = current_val / total_value if total_value else Decimal("0")
            target_pct = target_map.get(asset_type, Decimal("0"))
            result.append(
                {
                    "asset_type": asset_type,
                    "current_value": current_val,
                    "current_pct": current_pct,
                    "target_pct": target_pct,
                    "drift_pct": current_pct - target_pct,
                }
            )
        return result

    def rebalance_suggestion(
        self, portfolio_id: int, amount: Decimal, user: User | None = None
    ) -> list[dict]:
        """
        Smart rebalance: distribute an investment amount to minimize allocation drift.

        Algorithm:
        1. Get current holdings + manual assets by asset type
        2. Get target allocation percentages
        3. Calculate drift (current_pct - target_pct) per type
        4. Filter to underweight types (negative drift)
        5. Distribute amount proportionally to drift magnitude
        6. Recommend user's existing fund/asset per type, or top Shariah performer
        """
        if amount <= 0:
            return []

        # Step 1: Get holdings by asset type
        holdings = list(
            self.session.exec(
                select(PortfolioHolding).where(
                    PortfolioHolding.portfolio_id == portfolio_id
                )
            ).all()
        )

        type_values: dict[str, Decimal] = {}
        # Track user's largest holding per type for fund recommendation
        type_fund: dict[str, tuple[int | None, str]] = {}

        for h in holdings:
            fund = self.session.get(Fund, h.fund_id)
            if fund:
                ft = fund.fund_type
                live_val = self._live_value(h)
                type_values[ft] = type_values.get(ft, Decimal("0")) + live_val
                # Keep the fund with the largest value per type
                if ft not in type_fund or live_val > (type_values[ft] - live_val):
                    type_fund[ft] = (fund.id, fund.name)

        # Include manual assets (e.g. Savings Account)
        manual_assets = list(
            self.session.exec(
                select(ManualAsset).where(
                    ManualAsset.portfolio_id == portfolio_id
                )
            ).all()
        )
        for a in manual_assets:
            at = a.asset_type
            type_values[at] = type_values.get(at, Decimal("0")) + a.current_balance
            if at not in type_fund:
                type_fund[at] = (None, a.description)

        total_value = sum(type_values.values())

        # Step 2: Get target allocation
        targets = list(
            self.session.exec(
                select(TargetAllocation).where(
                    TargetAllocation.portfolio_id == portfolio_id
                )
            ).all()
        )

        if not targets:
            return []

        target_map = {t.asset_type: t.target_pct for t in targets}

        # Edge case: no holdings — distribute by target percentages
        if not total_value:
            return self._distribute_by_targets(amount, targets, target_map, type_fund)

        # Step 3: Calculate drift for each asset type
        all_types = set(list(type_values.keys()) + list(target_map.keys()))
        drifts: list[dict] = []
        for asset_type in all_types:
            current_val = type_values.get(asset_type, Decimal("0"))
            current_pct = current_val / total_value
            target_pct = target_map.get(asset_type, Decimal("0"))
            drift = current_pct - target_pct
            drifts.append({
                "asset_type": asset_type,
                "current_pct": current_pct,
                "target_pct": target_pct,
                "drift": drift,
            })

        # Step 4: Filter underweight (negative drift)
        underweight = [d for d in drifts if d["drift"] < Decimal("0")]

        # Edge case: nothing underweight — distribute by target percentages
        if not underweight:
            return self._distribute_by_targets(amount, targets, target_map, type_fund)

        # Step 5: Total negative drift magnitude
        total_negative_drift = sum(abs(d["drift"]) for d in underweight)

        # Step 6: Distribute proportionally
        results = []
        for d in underweight:
            proportion = abs(d["drift"]) / total_negative_drift if total_negative_drift else Decimal("0")
            suggested = amount * proportion

            fund_id, fund_name = self._recommend_fund(d["asset_type"], type_fund)

            reasoning = self._generate_reasoning(
                d["asset_type"], d["drift"], d["current_pct"], d["target_pct"], user
            )
            results.append({
                "asset_type": d["asset_type"],
                "suggested_amount": round(suggested, 2),
                "current_pct": round(d["current_pct"], 4),
                "target_pct": round(d["target_pct"], 4),
                "drift_pct": round(d["drift"], 4),
                "recommended_fund_id": fund_id,
                "recommended_fund_name": fund_name,
                "reasoning": reasoning,
            })

        return sorted(results, key=lambda r: r["suggested_amount"], reverse=True)

    def _distribute_by_targets(
        self,
        amount: Decimal,
        targets: list[TargetAllocation],
        target_map: dict[str, Decimal],
        type_fund: dict[str, tuple[int | None, str]],
    ) -> list[dict]:
        """Distribute amount proportionally to target allocation percentages."""
        total_target = sum(t.target_pct for t in targets)
        results = []
        for t in targets:
            pct = t.target_pct / total_target if total_target else Decimal("0")
            suggested = amount * pct
            fund_id, fund_name = self._recommend_fund(t.asset_type, type_fund)
            results.append({
                "asset_type": t.asset_type,
                "suggested_amount": round(suggested, 2),
                "current_pct": Decimal("0"),
                "target_pct": round(t.target_pct, 4),
                "drift_pct": round(-t.target_pct, 4),
                "recommended_fund_id": fund_id,
                "recommended_fund_name": fund_name,
                "reasoning": f"New position: allocate {float(t.target_pct * 100):.0f}% per your target",
            })
        return sorted(results, key=lambda r: r["suggested_amount"], reverse=True)

    def _generate_reasoning(
        self,
        asset_type: str,
        drift: Decimal,
        current_pct: Decimal,
        target_pct: Decimal,
        user: User | None,
    ) -> str:
        """Generate rule-based reasoning for a rebalance suggestion."""
        drift_pct = abs(float(drift * 100))
        parts = []

        # Drift magnitude
        if drift_pct > 10:
            parts.append(f"Significantly underweight by {drift_pct:.0f}pp — priority allocation")
        elif drift_pct > 5:
            parts.append(f"Moderately underweight by {drift_pct:.0f}pp")
        else:
            parts.append(f"Slightly underweight by {drift_pct:.1f}pp")

        # Asset type characteristics
        if asset_type in EQUITY_TYPES:
            parts.append("Equity offers long-term growth but higher volatility")
        elif asset_type in DEBT_TYPES:
            parts.append("Debt/Sukuk provides stable income with lower risk")
        elif asset_type in MONEY_MARKET_TYPES:
            parts.append("Money market offers capital preservation and liquidity")

        # Risk-profile-aware caveats
        if user and user.risk_tolerance:
            if user.risk_tolerance.value == "conservative" and asset_type in EQUITY_TYPES:
                parts.append("Consider your conservative profile — increase gradually")
            elif user.risk_tolerance.value == "aggressive" and asset_type in MONEY_MARKET_TYPES:
                parts.append(
                    "With an aggressive profile, keep money market allocation minimal"
                )

        return ". ".join(parts)

    def _recommend_fund(
        self,
        asset_type: str,
        type_fund: dict[str, tuple[int | None, str]],
    ) -> tuple[int | None, str | None]:
        """Return user's existing fund for this type, or top Shariah performer."""
        if asset_type in type_fund:
            return type_fund[asset_type]

        # Fallback: top Shariah-compliant performer for this fund type
        top_fund = self.session.exec(
            select(Fund)
            .where(
                Fund.fund_type == asset_type,
                Fund.is_shariah_compliant == True,
                Fund.return_ytd.isnot(None),
            )
            .order_by(Fund.return_ytd.desc())
            .limit(1)
        ).first()
        if top_fund:
            return (top_fund.id, top_fund.name)
        return (None, None)

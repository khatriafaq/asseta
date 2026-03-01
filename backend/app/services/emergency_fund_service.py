from decimal import Decimal

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.emergency_fund import (
    EmergencyFundConfig,
    EmergencyFundConfigUpdate,
    EmergencyFundTag,
    EmergencyFundTagCreate,
)
from app.models.expense import Expense
from app.models.fi_profile import FIProfile
from app.models.fund import Fund
from app.models.holding import PortfolioHolding
from app.models.manual_asset import ManualAsset
from app.models.portfolio import Portfolio


class EmergencyFundService:
    def __init__(self, session: Session):
        self.session = session

    # --- Config ---

    def get_config(self, user_id: int) -> EmergencyFundConfig | None:
        return self.session.exec(
            select(EmergencyFundConfig).where(EmergencyFundConfig.user_id == user_id)
        ).first()

    def upsert_config(self, user_id: int, data: EmergencyFundConfigUpdate) -> EmergencyFundConfig:
        config = self.get_config(user_id)
        if config:
            config.target_months = data.target_months
        else:
            config = EmergencyFundConfig(user_id=user_id, target_months=data.target_months)
        self.session.add(config)
        self.session.commit()
        self.session.refresh(config)
        return config

    # --- Tags ---

    def list_tags(self, user_id: int) -> list[dict]:
        tags = list(
            self.session.exec(
                select(EmergencyFundTag).where(EmergencyFundTag.user_id == user_id)
            ).all()
        )
        result = []
        for tag in tags:
            name = None
            current_value = Decimal("0")
            if tag.holding_id:
                holding = self.session.get(PortfolioHolding, tag.holding_id)
                if holding:
                    fund = self.session.get(Fund, holding.fund_id)
                    name = fund.name if fund else f"Holding #{tag.holding_id}"
                    current_value = holding.current_value
            elif tag.manual_asset_id:
                asset = self.session.get(ManualAsset, tag.manual_asset_id)
                if asset:
                    name = f"{asset.description} ({asset.asset_type})"
                    current_value = asset.current_balance
            result.append({
                "id": tag.id,
                "user_id": tag.user_id,
                "holding_id": tag.holding_id,
                "manual_asset_id": tag.manual_asset_id,
                "name": name,
                "current_value": float(current_value),
            })
        return result

    def add_tag(self, user_id: int, data: EmergencyFundTagCreate) -> EmergencyFundTag:
        if not data.holding_id and not data.manual_asset_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either holding_id or manual_asset_id must be provided",
            )
        if data.holding_id and data.manual_asset_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only one of holding_id or manual_asset_id can be provided",
            )
        # Check for duplicate
        query = select(EmergencyFundTag).where(EmergencyFundTag.user_id == user_id)
        if data.holding_id:
            query = query.where(EmergencyFundTag.holding_id == data.holding_id)
        else:
            query = query.where(EmergencyFundTag.manual_asset_id == data.manual_asset_id)
        existing = self.session.exec(query).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This item is already tagged as emergency fund",
            )
        tag = EmergencyFundTag(
            user_id=user_id,
            holding_id=data.holding_id,
            manual_asset_id=data.manual_asset_id,
        )
        self.session.add(tag)
        self.session.commit()
        self.session.refresh(tag)
        return tag

    def remove_tag(self, user_id: int, tag_id: int) -> None:
        tag = self.session.exec(
            select(EmergencyFundTag).where(
                EmergencyFundTag.id == tag_id,
                EmergencyFundTag.user_id == user_id,
            )
        ).first()
        if not tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tag not found",
            )
        self.session.delete(tag)
        self.session.commit()

    # --- Taggable Items ---

    def get_taggable_items(self, user_id: int) -> list[dict]:
        """List all holdings + manual assets with is_tagged flag."""
        # Get user's tagged items
        tags = list(
            self.session.exec(
                select(EmergencyFundTag).where(EmergencyFundTag.user_id == user_id)
            ).all()
        )
        tagged_holding_ids = {t.holding_id for t in tags if t.holding_id}
        tagged_asset_ids = {t.manual_asset_id for t in tags if t.manual_asset_id}
        # Build tag_id lookup
        holding_tag_map = {t.holding_id: t.id for t in tags if t.holding_id}
        asset_tag_map = {t.manual_asset_id: t.id for t in tags if t.manual_asset_id}

        portfolios = list(
            self.session.exec(
                select(Portfolio).where(Portfolio.user_id == user_id)
            ).all()
        )

        items = []
        for p in portfolios:
            # Holdings
            holdings = list(
                self.session.exec(
                    select(PortfolioHolding).where(PortfolioHolding.portfolio_id == p.id)
                ).all()
            )
            for h in holdings:
                fund = self.session.get(Fund, h.fund_id)
                items.append({
                    "type": "holding",
                    "holding_id": h.id,
                    "manual_asset_id": None,
                    "name": fund.name if fund else f"Fund #{h.fund_id}",
                    "asset_type": fund.fund_type if fund else "Unknown",
                    "current_value": float(h.current_value),
                    "is_tagged": h.id in tagged_holding_ids,
                    "tag_id": holding_tag_map.get(h.id),
                })

            # Manual assets
            assets = list(
                self.session.exec(
                    select(ManualAsset).where(ManualAsset.portfolio_id == p.id)
                ).all()
            )
            for a in assets:
                items.append({
                    "type": "manual_asset",
                    "holding_id": None,
                    "manual_asset_id": a.id,
                    "name": a.description,
                    "asset_type": a.asset_type,
                    "current_value": float(a.current_balance),
                    "is_tagged": a.id in tagged_asset_ids,
                    "tag_id": asset_tag_map.get(a.id),
                })

        return items

    def get_excluded_holding_ids(self, user_id: int) -> set[int]:
        """Return holding IDs tagged as emergency fund (to exclude from investment analytics)."""
        tags = list(
            self.session.exec(
                select(EmergencyFundTag).where(EmergencyFundTag.user_id == user_id)
            ).all()
        )
        return {t.holding_id for t in tags if t.holding_id is not None}

    # --- Dashboard ---

    def get_dashboard(self, user_id: int) -> dict:
        config = self.get_config(user_id)
        target_months = config.target_months if config else 6

        # Monthly essential expenses — average last 3 months
        monthly_essential = self._calc_monthly_essential(user_id)

        target_amount = float(monthly_essential) * target_months
        current_balance = self._calc_tagged_balance(user_id)

        progress_pct = (current_balance / target_amount * 100) if target_amount > 0 else 0
        months_covered = (current_balance / float(monthly_essential)) if monthly_essential > 0 else 0
        gap = target_amount - current_balance

        if months_covered < 1:
            ef_status = "critical"
        elif months_covered < 3:
            ef_status = "building"
        elif months_covered < target_months:
            ef_status = "healthy"
        else:
            ef_status = "strong"

        milestones = []
        for m in [3, 6, 9, 12]:
            milestone_target = float(monthly_essential) * m
            milestones.append({
                "months": m,
                "target": milestone_target,
                "reached": current_balance >= milestone_target if monthly_essential > 0 else False,
            })

        return {
            "target_months": target_months,
            "monthly_essential": float(monthly_essential),
            "target_amount": target_amount,
            "current_balance": current_balance,
            "progress_pct": round(progress_pct, 1),
            "months_covered": round(months_covered, 1),
            "gap": round(gap, 2),
            "status": ef_status,
            "milestones": milestones,
        }

    def _calc_monthly_essential(self, user_id: int) -> Decimal:
        """Average essential expenses over last 3 months."""
        # Get distinct months with essential expenses, ordered desc
        all_expenses = list(
            self.session.exec(
                select(Expense).where(
                    Expense.user_id == user_id,
                    Expense.is_essential == True,
                )
            ).all()
        )
        if not all_expenses:
            # Fallback to FI profile monthly_expenses
            fi = self.session.exec(
                select(FIProfile).where(FIProfile.user_id == user_id)
            ).first()
            return fi.monthly_expenses if fi else Decimal("0")

        # Group by month, take last 3
        month_totals: dict[str, Decimal] = {}
        for e in all_expenses:
            month_totals[e.month] = month_totals.get(e.month, Decimal("0")) + e.amount

        sorted_months = sorted(month_totals.keys(), reverse=True)[:3]
        if not sorted_months:
            return Decimal("0")
        total = sum(month_totals[m] for m in sorted_months)
        return total / len(sorted_months)

    def _calc_tagged_balance(self, user_id: int) -> float:
        """Sum current values of tagged holdings + manual assets."""
        tags = list(
            self.session.exec(
                select(EmergencyFundTag).where(EmergencyFundTag.user_id == user_id)
            ).all()
        )
        balance = Decimal("0")
        for tag in tags:
            if tag.holding_id:
                holding = self.session.get(PortfolioHolding, tag.holding_id)
                if holding:
                    balance += holding.current_value
            elif tag.manual_asset_id:
                asset = self.session.get(ManualAsset, tag.manual_asset_id)
                if asset:
                    balance += asset.current_balance
        return float(balance)

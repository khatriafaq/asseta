from datetime import date
from decimal import Decimal
import math

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.expense import Expense
from app.models.fi_profile import FIProfile, FIProfileUpdate
from app.models.holding import PortfolioHolding
from app.models.income import Income
from app.models.manual_asset import ManualAsset
from app.models.networth_snapshot import NetWorthSnapshot
from app.models.portfolio import Portfolio
from app.models.user import User


class FIService:
    def __init__(self, session: Session):
        self.session = session

    # --- FI Profile ---

    def get_profile(self, user_id: int) -> FIProfile | None:
        return self.session.exec(
            select(FIProfile).where(FIProfile.user_id == user_id)
        ).first()

    def upsert_profile(self, user_id: int, data: FIProfileUpdate) -> FIProfile:
        profile = self.get_profile(user_id)
        update_data = data.model_dump(exclude_unset=True)

        if profile:
            for key, value in update_data.items():
                if value is not None:
                    setattr(profile, key, value)
        else:
            monthly_exp = update_data.get("monthly_expenses")
            if not monthly_exp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="monthly_expenses is required for initial FI profile setup",
                )
            profile = FIProfile(user_id=user_id, **update_data)

        # Auto-calculate FI number: annual expenses / SWR
        if profile.monthly_expenses and profile.safe_withdrawal_rate:
            annual = profile.monthly_expenses * 12
            profile.fi_number = annual / profile.safe_withdrawal_rate

        self.session.add(profile)
        self.session.commit()
        self.session.refresh(profile)
        return profile

    # --- Dashboard ---

    def get_dashboard(self, user_id: int) -> dict:
        # --- Net worth (portfolio-independent of FI profile) ---
        portfolios = list(
            self.session.exec(
                select(Portfolio).where(Portfolio.user_id == user_id)
            ).all()
        )
        total_portfolio_value = Decimal("0")
        for p in portfolios:
            holdings = list(
                self.session.exec(
                    select(PortfolioHolding).where(
                        PortfolioHolding.portfolio_id == p.id
                    )
                ).all()
            )
            total_portfolio_value += sum(h.current_value for h in holdings)

        net_worth = total_portfolio_value

        # --- Income/expenses for current month (independent of FI profile) ---
        today = date.today()
        current_month = today.strftime("%Y-%m")

        incomes = list(
            self.session.exec(
                select(Income).where(
                    Income.user_id == user_id, Income.month == current_month
                )
            ).all()
        )
        expenses = list(
            self.session.exec(
                select(Expense).where(
                    Expense.user_id == user_id, Expense.month == current_month
                )
            ).all()
        )

        total_income = sum(i.amount for i in incomes) if incomes else Decimal("0")
        total_expenses = sum(e.amount for e in expenses) if expenses else Decimal("0")
        passive_income = (
            sum(i.amount for i in incomes if i.is_passive) if incomes else Decimal("0")
        )
        savings_amount = total_income - total_expenses
        savings_rate = savings_amount / total_income if total_income else Decimal("0")

        # --- FI profile (required only for fi_number / fi_progress / projection) ---
        profile = self.get_profile(user_id)
        if not profile:
            return {
                "fi_number": None,
                "fi_strategy": None,
                "net_worth": net_worth,
                "fi_progress_pct": None,
                "projected_fi_date": None,
                "monthly_income": total_income,
                "monthly_expenses": total_expenses,
                "savings_amount": savings_amount,
                "savings_rate": savings_rate,
                "passive_income": passive_income,
                "passive_income_ratio": Decimal("0"),
                "coast_fi_number": None,
                "coast_fi_progress_pct": None,
                "barista_fi_number": None,
                "barista_fi_progress_pct": None,
                "barista_monthly_income": None,
            }

        passive_ratio = (
            passive_income / profile.monthly_expenses
            if profile.monthly_expenses
            else Decimal("0")
        )

        fi_progress = (
            net_worth / profile.fi_number
            if profile.fi_number and profile.fi_number > 0
            else Decimal("0")
        )

        # Projected FI date
        projected_date = self._project_fi_date(
            net_worth=net_worth,
            monthly_savings=savings_amount,
            fi_number=profile.fi_number or Decimal("0"),
            expected_return=profile.expected_return_rate,
            inflation=profile.inflation_rate,
        )

        # --- Coast FI ---
        # Coast FI Number = FI Number / (1 + real_return)^years_remaining
        # Uses investment_horizon_years from User, or target_fi_date from profile
        coast_fi_number = None
        coast_fi_progress = None
        real_return = float((1 + profile.expected_return_rate) / (1 + profile.inflation_rate) - 1)

        years_remaining = None
        if profile.target_fi_date:
            years_remaining = max(0, (profile.target_fi_date - today).days / 365.25)
        else:
            user = self.session.get(User, user_id)
            if user and user.investment_horizon_years:
                years_remaining = float(user.investment_horizon_years)

        if years_remaining and years_remaining > 0 and profile.fi_number and real_return > 0:
            coast_fi_number = Decimal(str(
                float(profile.fi_number) / (1 + real_return) ** years_remaining
            )).quantize(Decimal("0.01"))
            if coast_fi_number > 0:
                coast_fi_progress = (net_worth / coast_fi_number).quantize(Decimal("0.0001"))

        # --- Barista FI ---
        # Barista FI Number = (annual_expenses - barista_annual_income) / SWR
        barista_fi_number = None
        barista_fi_progress = None
        if profile.barista_monthly_income and profile.barista_monthly_income > 0:
            annual_expenses = profile.monthly_expenses * 12
            barista_annual_income = profile.barista_monthly_income * 12
            gap = annual_expenses - barista_annual_income
            if gap > 0 and profile.safe_withdrawal_rate > 0:
                barista_fi_number = (gap / profile.safe_withdrawal_rate).quantize(Decimal("0.01"))
                if barista_fi_number > 0:
                    barista_fi_progress = (net_worth / barista_fi_number).quantize(Decimal("0.0001"))

        return {
            "fi_number": profile.fi_number,
            "fi_strategy": profile.fi_strategy,
            "net_worth": net_worth,
            "fi_progress_pct": fi_progress,
            "projected_fi_date": projected_date,
            "monthly_income": total_income,
            "monthly_expenses": total_expenses,
            "savings_amount": savings_amount,
            "savings_rate": savings_rate,
            "passive_income": passive_income,
            "passive_income_ratio": passive_ratio,
            "coast_fi_number": coast_fi_number,
            "coast_fi_progress_pct": coast_fi_progress,
            "barista_fi_number": barista_fi_number,
            "barista_fi_progress_pct": barista_fi_progress,
            "barista_monthly_income": profile.barista_monthly_income,
        }

    # --- Net Worth ---

    def list_networth(self, user_id: int) -> list[NetWorthSnapshot]:
        return list(
            self.session.exec(
                select(NetWorthSnapshot)
                .where(NetWorthSnapshot.user_id == user_id)
                .order_by(NetWorthSnapshot.month.desc())
            ).all()
        )

    def generate_networth_snapshot(self, user_id: int) -> NetWorthSnapshot:
        today = date.today()
        month_str = today.strftime("%Y-%m")

        # Remove existing for this month
        existing = self.session.exec(
            select(NetWorthSnapshot).where(
                NetWorthSnapshot.user_id == user_id,
                NetWorthSnapshot.month == month_str,
            )
        ).first()
        if existing:
            self.session.delete(existing)
            self.session.commit()

        # Assets
        portfolios = list(
            self.session.exec(
                select(Portfolio).where(Portfolio.user_id == user_id)
            ).all()
        )
        total_assets = Decimal("0")
        for p in portfolios:
            holdings = list(
                self.session.exec(
                    select(PortfolioHolding).where(
                        PortfolioHolding.portfolio_id == p.id
                    )
                ).all()
            )
            total_assets += sum(h.current_value for h in holdings)

        # Income/expenses
        incomes = list(
            self.session.exec(
                select(Income).where(
                    Income.user_id == user_id, Income.month == month_str
                )
            ).all()
        )
        expenses = list(
            self.session.exec(
                select(Expense).where(
                    Expense.user_id == user_id, Expense.month == month_str
                )
            ).all()
        )

        total_income = sum(i.amount for i in incomes) if incomes else Decimal("0")
        total_expenses = sum(e.amount for e in expenses) if expenses else Decimal("0")
        passive_income = (
            sum(i.amount for i in incomes if i.is_passive) if incomes else Decimal("0")
        )
        savings = total_income - total_expenses
        savings_rate = savings / total_income if total_income else Decimal("0")

        monthly_exp = total_expenses if total_expenses else Decimal("1")
        passive_ratio = passive_income / monthly_exp

        # FI progress
        profile = self.get_profile(user_id)
        fi_pct = None
        if profile and profile.fi_number and profile.fi_number > 0:
            fi_pct = total_assets / profile.fi_number

        snap = NetWorthSnapshot(
            user_id=user_id,
            month=month_str,
            total_assets=total_assets,
            total_liabilities=Decimal("0"),
            net_worth=total_assets,
            total_income=total_income,
            total_expenses=total_expenses,
            savings_amount=savings,
            savings_rate=savings_rate,
            passive_income=passive_income,
            passive_income_ratio=passive_ratio,
            fi_progress_pct=fi_pct,
        )
        self.session.add(snap)
        self.session.commit()
        self.session.refresh(snap)
        return snap

    # --- Projection ---

    def get_projection(self, user_id: int) -> dict:
        profile = self.get_profile(user_id)
        if not profile or not profile.fi_number:
            return {"error": "FI profile not set up"}

        dashboard = self.get_dashboard(user_id)
        net_worth = dashboard["net_worth"]
        monthly_savings = dashboard["savings_amount"]

        projected = self._project_fi_date(
            net_worth=net_worth,
            monthly_savings=monthly_savings,
            fi_number=profile.fi_number,
            expected_return=profile.expected_return_rate,
            inflation=profile.inflation_rate,
        )

        return {
            "current_net_worth": net_worth,
            "fi_number": profile.fi_number,
            "monthly_savings": monthly_savings,
            "expected_return": profile.expected_return_rate,
            "inflation": profile.inflation_rate,
            "real_return": profile.expected_return_rate - profile.inflation_rate,
            "projected_fi_date": projected,
            "fi_progress_pct": dashboard["fi_progress_pct"],
        }

    def get_what_if(
        self,
        user_id: int,
        monthly_savings: Decimal | None = None,
        expected_return: Decimal | None = None,
        inflation: Decimal | None = None,
    ) -> dict:
        profile = self.get_profile(user_id)
        if not profile or not profile.fi_number:
            return {"error": "FI profile not set up"}

        dashboard = self.get_dashboard(user_id)
        nw = dashboard["net_worth"]
        ms = monthly_savings if monthly_savings is not None else dashboard["savings_amount"]
        er = expected_return if expected_return is not None else profile.expected_return_rate
        inf = inflation if inflation is not None else profile.inflation_rate

        projected = self._project_fi_date(
            net_worth=nw,
            monthly_savings=ms,
            fi_number=profile.fi_number,
            expected_return=er,
            inflation=inf,
        )

        return {
            "scenario": {
                "monthly_savings": ms,
                "expected_return": er,
                "inflation": inf,
            },
            "projected_fi_date": projected,
            "current_net_worth": nw,
            "fi_number": profile.fi_number,
        }

    def _project_fi_date(
        self,
        net_worth: Decimal,
        monthly_savings: Decimal,
        fi_number: Decimal,
        expected_return: Decimal,
        inflation: Decimal,
    ) -> str | None:
        if fi_number <= 0 or (net_worth >= fi_number):
            return "Already FI!" if net_worth >= fi_number else None

        # Correct compound formula: (1 + nominal) / (1 + inflation) - 1
        real_return = float((1 + expected_return) / (1 + inflation) - 1)
        if real_return <= 0 and float(monthly_savings) <= 0:
            return None

        # Correct compound monthly rate: (1 + annual)^(1/12) - 1
        monthly_rate = (1 + real_return) ** (1 / 12) - 1
        nw = float(net_worth)
        target = float(fi_number)
        ms = float(monthly_savings)

        if monthly_rate > 0 and ms > 0:
            # Future value of current savings + future value of annuity
            # FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r = target
            # Solve for n iteratively
            months = 0
            current = nw
            while current < target and months < 1200:  # cap at 100 years
                current = current * (1 + monthly_rate) + ms
                months += 1
            if months >= 1200:
                return None
            years = months / 12
            projected_year = date.today().year + int(years)
            projected_month = date.today().month + int((years % 1) * 12)
            if projected_month > 12:
                projected_year += 1
                projected_month -= 12
            return f"{projected_year}-{projected_month:02d}"
        elif ms > 0:
            months_needed = (target - nw) / ms
            if months_needed < 0:
                return "Already FI!"
            years = months_needed / 12
            projected_year = date.today().year + int(years)
            return f"{projected_year}"
        else:
            return None

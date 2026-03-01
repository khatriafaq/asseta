import datetime as dt
from decimal import Decimal

from sqlmodel import Session, select

from app.models.fund import Fund
from app.models.holding import PortfolioHolding
from app.models.institution import Institution
from app.models.manual_asset import ManualAsset
from app.models.risk_score import ConcentrationWarning, RiskScore
from app.models.target_allocation import TargetAllocation
from app.models.user import User

FUND_CONCENTRATION_THRESHOLD = Decimal("0.30")  # 30%
INSTITUTION_CONCENTRATION_THRESHOLD = Decimal("0.40")  # 40%

EQUITY_TYPES = {"Equity Fund", "Equity"}


class RiskScoringService:
    def __init__(self, session: Session):
        self.session = session

    def calculate_risk_score(self, portfolio_id: int, user: User) -> RiskScore:
        holdings = list(
            self.session.exec(
                select(PortfolioHolding).where(
                    PortfolioHolding.portfolio_id == portfolio_id
                )
            ).all()
        )
        manual_assets = list(
            self.session.exec(
                select(ManualAsset).where(ManualAsset.portfolio_id == portfolio_id)
            ).all()
        )

        # Build value maps
        fund_values: dict[str, Decimal] = {}  # fund_name -> value
        type_values: dict[str, Decimal] = {}  # asset_type -> value
        institution_values: dict[str, Decimal] = {}  # institution_name -> value

        for h in holdings:
            fund = self.session.get(Fund, h.fund_id)
            if not fund:
                continue
            fund_values[fund.name] = fund_values.get(fund.name, Decimal("0")) + h.current_value
            ft = fund.fund_type
            type_values[ft] = type_values.get(ft, Decimal("0")) + h.current_value
            if fund.institution_id:
                inst = self.session.get(Institution, fund.institution_id)
                if inst:
                    institution_values[inst.name] = (
                        institution_values.get(inst.name, Decimal("0")) + h.current_value
                    )

        for a in manual_assets:
            at = a.asset_type
            type_values[at] = type_values.get(at, Decimal("0")) + a.current_balance

        total_value = sum(type_values.values())
        if not total_value:
            return RiskScore(
                health_score=50,
                diversification_grade="N/A",
                risk_factors=["No holdings found — add investments to get a risk assessment"],
            )

        score = 100
        risk_factors: list[str] = []
        warnings: list[ConcentrationWarning] = []

        # ── Concentration Risk (0-30 pts deducted) ──
        concentration_deduction = 0
        for fund_name, value in fund_values.items():
            weight = value / total_value
            if weight > FUND_CONCENTRATION_THRESHOLD:
                pct = float(weight * 100)
                warnings.append(
                    ConcentrationWarning(
                        entity=fund_name,
                        entity_type="fund",
                        weight_pct=round(pct, 1),
                        threshold_pct=float(FUND_CONCENTRATION_THRESHOLD * 100),
                        message=f"{fund_name} is {pct:.0f}% of portfolio (threshold: {float(FUND_CONCENTRATION_THRESHOLD * 100):.0f}%)",
                    )
                )
                concentration_deduction += min(15, int((pct - 30) * 0.5))

        for inst_name, value in institution_values.items():
            weight = value / total_value
            if weight > INSTITUTION_CONCENTRATION_THRESHOLD:
                pct = float(weight * 100)
                warnings.append(
                    ConcentrationWarning(
                        entity=inst_name,
                        entity_type="institution",
                        weight_pct=round(pct, 1),
                        threshold_pct=float(INSTITUTION_CONCENTRATION_THRESHOLD * 100),
                        message=f"{inst_name} is {pct:.0f}% of portfolio (threshold: {float(INSTITUTION_CONCENTRATION_THRESHOLD * 100):.0f}%)",
                    )
                )
                concentration_deduction += min(15, int((pct - 40) * 0.5))

        concentration_deduction = min(concentration_deduction, 30)
        score -= concentration_deduction
        if concentration_deduction > 0:
            risk_factors.append(
                f"Concentration risk: {concentration_deduction}pts deducted for overweight positions"
            )

        # ── Diversification Grade (0-30 pts deducted) ──
        significant_types = sum(
            1 for v in type_values.values() if v / total_value >= Decimal("0.05")
        )
        if significant_types >= 4:
            grade = "A"
            div_deduction = 0
        elif significant_types == 3:
            grade = "B"
            div_deduction = 10
        elif significant_types == 2:
            grade = "C"
            div_deduction = 20
        else:
            grade = "D"
            div_deduction = 30

        score -= div_deduction
        if div_deduction > 0:
            risk_factors.append(
                f"Diversification grade {grade}: Only {significant_types} asset type(s) with >5% allocation"
            )

        # ── Age-Appropriate Check (0-20 pts deducted) ──
        age_appropriate = None
        age_message = None
        if user.date_of_birth:
            age = (dt.date.today() - user.date_of_birth).days // 365
            equity_value = sum(
                v for t, v in type_values.items() if t in EQUITY_TYPES
            )
            equity_pct = float(equity_value / total_value * 100) if total_value else 0
            max_equity = min(100 - age, 80)

            if equity_pct <= max_equity + 5:  # 5% tolerance
                age_appropriate = True
                age_message = f"Equity allocation ({equity_pct:.0f}%) is appropriate for age {age}"
            else:
                age_appropriate = False
                overshoot = equity_pct - max_equity
                age_deduction = min(20, int(overshoot))
                score -= age_deduction
                age_message = (
                    f"Equity allocation ({equity_pct:.0f}%) exceeds recommended "
                    f"{max_equity}% for age {age}"
                )
                risk_factors.append(age_message)

        # ── Target Adherence (0-20 pts deducted) ──
        targets = list(
            self.session.exec(
                select(TargetAllocation).where(
                    TargetAllocation.portfolio_id == portfolio_id
                )
            ).all()
        )
        if targets:
            total_drift = Decimal("0")
            for t in targets:
                current_val = type_values.get(t.asset_type, Decimal("0"))
                current_pct = current_val / total_value if total_value else Decimal("0")
                drift = abs(current_pct - t.target_pct)
                total_drift += drift
            avg_drift = total_drift / len(targets)
            drift_pct = float(avg_drift * 100)
            if drift_pct > 10:
                target_deduction = min(20, int(drift_pct))
                score -= target_deduction
                risk_factors.append(
                    f"Average allocation drift is {drift_pct:.1f}pp from targets"
                )
        else:
            risk_factors.append("No target allocation set — consider setting targets to track drift")

        score = max(0, min(100, score))

        return RiskScore(
            health_score=score,
            diversification_grade=grade,
            concentration_warnings=warnings,
            age_appropriate=age_appropriate,
            age_appropriate_message=age_message,
            risk_factors=risk_factors,
        )

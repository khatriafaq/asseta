from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlmodel import Session

from app.models.fund import Fund
from app.models.holding import PortfolioHolding
from app.models.transaction import Transaction, TransactionCreate, TransactionUpdate
from app.repositories.holding_repo import HoldingRepository
from app.repositories.transaction_repo import TransactionRepository


class TransactionService:
    def __init__(self, session: Session):
        self.repo = TransactionRepository(session)
        self.holding_repo = HoldingRepository(session)
        self.session = session

    def list_transactions(self, portfolio_id: int) -> list[Transaction]:
        return self.repo.list_by_portfolio(portfolio_id)

    def get_transaction(self, txn_id: int, portfolio_id: int) -> Transaction:
        txn = self.repo.get_by_id_and_portfolio(txn_id, portfolio_id)
        if not txn:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
            )
        return txn

    def create_transaction(
        self, data: TransactionCreate, portfolio_id: int
    ) -> Transaction:
        # Auto-compute signed_amount and xirr_cashflow
        signed = data.signed_amount
        if signed is None:
            if data.transaction_type in ("Withdrawal",):
                signed = -abs(data.amount)
            else:
                signed = abs(data.amount)

        xirr_cf = data.xirr_cashflow
        if xirr_cf is None:
            xirr_cf = -signed  # Deposits are outflows (negative) for XIRR

        txn = Transaction(
            portfolio_id=portfolio_id,
            fund_id=data.fund_id,
            date=data.date,
            transaction_type=data.transaction_type,
            units=data.units,
            price_per_unit=data.price_per_unit,
            amount=data.amount,
            signed_amount=signed,
            xirr_cashflow=xirr_cf,
        )
        self.repo.create(txn)
        self._recalculate_holding(portfolio_id, data.fund_id)
        return txn

    def update_transaction(
        self, txn_id: int, data: TransactionUpdate, portfolio_id: int
    ) -> Transaction:
        txn = self.get_transaction(txn_id, portfolio_id)
        update_data = data.model_dump(exclude_unset=True)
        if update_data:
            self.repo.update(txn, update_data)
            self._recalculate_holding(portfolio_id, txn.fund_id)
        return txn

    def delete_transaction(self, txn_id: int, portfolio_id: int) -> None:
        txn = self.get_transaction(txn_id, portfolio_id)
        fund_id = txn.fund_id
        self.repo.delete(txn)
        self._recalculate_holding(portfolio_id, fund_id)

    def bulk_create(
        self, transactions: list[TransactionCreate], portfolio_id: int
    ) -> list[Transaction]:
        created = []
        for data in transactions:
            created.append(self.create_transaction(data, portfolio_id))
        return created

    def _recalculate_holding(self, portfolio_id: int, fund_id: int) -> None:
        txns = self.repo.list_by_fund_and_portfolio(fund_id, portfolio_id)
        if not txns:
            existing = self.holding_repo.get_by_fund(portfolio_id, fund_id)
            if existing:
                self.holding_repo.delete(existing)
            return

        total_units = Decimal("0")
        total_invested = Decimal("0")
        cash_profit = Decimal("0")
        for t in txns:
            if t.transaction_type in ("Deposit", "Dividend"):
                total_units += t.units
                total_invested += t.amount
            elif t.transaction_type == "Withdrawal":
                total_units -= t.units
                total_invested -= t.amount
            elif t.transaction_type == "Profit":
                total_units += t.units
                # Cash profit (units=0) isn't captured by units*NAV
                if t.units == 0:
                    cash_profit += t.amount

        avg_cost = total_invested / total_units if total_units else Decimal("0")

        fund = self.session.get(Fund, fund_id)
        is_savings = fund and fund.fund_type in ("Savings Account",)

        if is_savings:
            # Savings accounts: value = deposits - withdrawals + profit
            current_value = total_invested + cash_profit
        else:
            nav = fund.current_nav if fund and fund.current_nav else avg_cost
            current_value = total_units * nav + cash_profit

        gain_loss = current_value - total_invested
        return_pct = (gain_loss / total_invested) if total_invested else Decimal("0")

        holding = self.holding_repo.get_by_fund(portfolio_id, fund_id)
        if holding:
            self.holding_repo.update(
                holding,
                {
                    "units_held": total_units,
                    "total_invested": total_invested,
                    "avg_cost_per_unit": avg_cost,
                    "current_value": current_value,
                    "gain_loss": gain_loss,
                    "return_pct": return_pct,
                    "updated_at": datetime.now(timezone.utc),
                },
            )
        else:
            self.holding_repo.create(
                PortfolioHolding(
                    portfolio_id=portfolio_id,
                    fund_id=fund_id,
                    units_held=total_units,
                    total_invested=total_invested,
                    avg_cost_per_unit=avg_cost,
                    current_value=current_value,
                    gain_loss=gain_loss,
                    return_pct=return_pct,
                    updated_at=datetime.now(timezone.utc),
                )
            )

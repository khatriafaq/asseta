import type { Income, Expense, Transaction } from "@/lib/types";

export interface BudgetBreakdown {
  totalIncome: number;
  needs: {
    total: number;
    pct: number;
    target: number;
    status: "good" | "warning" | "danger";
    items: Expense[];
  };
  wants: {
    total: number;
    pct: number;
    target: number;
    status: "good" | "warning" | "danger";
    items: Expense[];
  };
  investing: {
    total: number;
    pct: number;
    target: number;
    status: "good" | "warning" | "danger";
    transactions: Transaction[];
  };
  savingsRate: number;
  unallocated: number;
}

export function calculateBudget(
  incomes: Income[],
  expenses: Expense[],
  transactions: Transaction[],
  selectedMonth: string
): BudgetBreakdown {
  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);

  const needsItems = expenses.filter((e) => e.is_essential);
  const wantsItems = expenses.filter((e) => !e.is_essential);
  const needsTotal = needsItems.reduce((sum, e) => sum + Number(e.amount), 0);
  const wantsTotal = wantsItems.reduce((sum, e) => sum + Number(e.amount), 0);

  // Filter transactions to this month's deposits only
  const monthDeposits = transactions.filter(
    (t) =>
      t.transaction_type === "Deposit" &&
      t.date.startsWith(selectedMonth)
  );
  const investingTotal = monthDeposits.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  const needsPct = totalIncome > 0 ? needsTotal / totalIncome : 0;
  const wantsPct = totalIncome > 0 ? wantsTotal / totalIncome : 0;
  const investingPct = totalIncome > 0 ? investingTotal / totalIncome : 0;
  const savingsRate =
    totalIncome > 0 ? (totalIncome - needsTotal - wantsTotal) / totalIncome : 0;

  return {
    totalIncome,
    needs: {
      total: needsTotal,
      pct: needsPct,
      target: 0.5,
      status: needsPct <= 0.5 ? "good" : needsPct <= 0.55 ? "warning" : "danger",
      items: needsItems,
    },
    wants: {
      total: wantsTotal,
      pct: wantsPct,
      target: 0.3,
      status: wantsPct <= 0.3 ? "good" : wantsPct <= 0.35 ? "warning" : "danger",
      items: wantsItems,
    },
    investing: {
      total: investingTotal,
      pct: investingPct,
      target: 0.2,
      status:
        investingPct >= 0.2 ? "good" : investingPct >= 0.15 ? "warning" : "danger",
      transactions: monthDeposits,
    },
    savingsRate,
    unallocated: totalIncome - needsTotal - wantsTotal - investingTotal,
  };
}

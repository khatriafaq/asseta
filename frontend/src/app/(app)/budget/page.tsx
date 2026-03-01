"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Wallet, Loader2 } from "lucide-react";
import { formatPKR } from "@/lib/utils";
import { useIncome, useExpenses } from "@/lib/hooks/use-budget";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { usePortfolios } from "@/lib/hooks/use-portfolios";
import { usePortfolioStore } from "@/lib/stores/portfolio-store";
import { calculateBudget } from "@/lib/utils/budget-calculations";
import { MonthSelector } from "@/components/budget/month-selector";
import { IncomeSection } from "@/components/budget/income-section";
import { BudgetBar } from "@/components/budget/budget-bar";
import { ExpenseBucketSection } from "@/components/budget/expense-bucket-section";
import { InvestingSection } from "@/components/budget/investing-section";
import { SavingsRateCard } from "@/components/budget/savings-rate-card";
import { BudgetVsActual } from "@/components/budget/budget-vs-actual";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function BudgetPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const month = searchParams.get("month") ?? getCurrentMonth();
  const setMonth = (newMonth: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("month", newMonth);
    router.push(`${pathname}?${params.toString()}`);
  };

  const activePortfolioId = usePortfolioStore((s) => s.activePortfolioId);
  usePortfolios();

  const { data: incomeData, isLoading: incomeLoading } = useIncome(month);
  const { data: expenseData, isLoading: expenseLoading } = useExpenses(month);
  const { data: transactionData } = useTransactions(activePortfolioId);

  const budget = useMemo(
    () =>
      calculateBudget(
        incomeData ?? [],
        expenseData ?? [],
        transactionData ?? [],
        month
      ),
    [incomeData, expenseData, transactionData, month]
  );

  if (incomeLoading || expenseLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--jade)]" />
      </div>
    );
  }

  const hasIncome = budget.totalIncome > 0;
  const netAmount = budget.totalIncome - budget.needs.total - budget.wants.total;
  const monthLabel = new Date(month + "-01").toLocaleDateString("en-PK", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Budget
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {monthLabel} &middot; 50/30/20 breakdown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector selectedMonth={month} onChange={setMonth} />
          {hasIncome && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50">
              <Wallet className="w-4 h-4 text-[var(--jade)]" />
              <span className="text-sm font-medium">
                Net:{" "}
                <span
                  className="font-mono-nums"
                  style={{ color: netAmount >= 0 ? "var(--jade)" : "var(--coral)" }}
                >
                  {formatPKR(netAmount)}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Income Section — always visible so user can add */}
      <div className="animate-fade-in-up stagger-1">
        <IncomeSection incomes={incomeData ?? []} month={month} />
      </div>

      {!hasIncome ? (
        /* Empty state: income is zero, hide budget breakdown */
        <div className="glass-card p-10 text-center animate-fade-in-up stagger-2">
          <Wallet className="mx-auto w-10 h-10 text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)] text-sm">
            Add your income for {monthLabel} above to see your 50/30/20 budget breakdown.
          </p>
        </div>
      ) : (
        <>
          {/* Budget Allocation Bar */}
          {hasIncome && (
            <div className="animate-fade-in-up stagger-2">
              <BudgetBar
                needsTotal={budget.needs.total}
                wantsTotal={budget.wants.total}
                investingTotal={budget.investing.total}
                totalIncome={budget.totalIncome}
              />
            </div>
          )}

          {/* Three-column: Needs / Wants / Investing */}
          {hasIncome && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up stagger-3">
              <ExpenseBucketSection
                title="Needs"
                bucket="needs"
                expenses={budget.needs.items}
                totalIncome={budget.totalIncome}
                targetPct={0.5}
                month={month}
                color="#38BDF8"
              />
              <ExpenseBucketSection
                title="Wants"
                bucket="wants"
                expenses={budget.wants.items}
                totalIncome={budget.totalIncome}
                targetPct={0.3}
                month={month}
                color="#A78BFA"
              />
              <InvestingSection
                transactions={budget.investing.transactions}
                totalIncome={budget.totalIncome}
              />
            </div>
          )}

          {/* Bottom row: Savings Rate + Budget vs Actual */}
          {hasIncome && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up stagger-4">
              <SavingsRateCard savingsRate={budget.savingsRate} />
              <BudgetVsActual
                targets={{
                  needs: budget.totalIncome * 0.5,
                  wants: budget.totalIncome * 0.3,
                  investing: budget.totalIncome * 0.2,
                }}
                actuals={{
                  needs: budget.needs.total,
                  wants: budget.wants.total,
                  investing: budget.investing.total,
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

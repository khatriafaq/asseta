"use client";

import { ArrowRight } from "lucide-react";
import { formatPKR, formatDate } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface InvestingSectionProps {
  transactions: Transaction[];
  totalIncome: number;
}

const STATUS_COLORS = {
  good: "var(--jade)",
  warning: "#FBBF24",
  danger: "var(--coral)",
};

export function InvestingSection({ transactions, totalIncome }: InvestingSectionProps) {
  const total = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const budgetAmount = totalIncome * 0.2;
  const pct = totalIncome > 0 ? total / totalIncome : 0;
  const status = pct >= 0.2 ? "good" : pct >= 0.15 ? "warning" : "danger";
  const progressPct = budgetAmount > 0 ? Math.min(100, (total / budgetAmount) * 100) : 0;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium">Investing</h3>
          <p className="text-[10px] text-[var(--text-muted)]">20% target</p>
        </div>
      </div>

      {/* Amount + percentage */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-mono-nums text-lg font-semibold">{formatPKR(total)}</span>
        <span className="text-[11px] text-[var(--text-muted)]">/ {formatPKR(budgetAmount)}</span>
        <span
          className="font-mono-nums text-xs font-medium ml-auto"
          style={{ color: STATUS_COLORS[status] }}
        >
          {(pct * 100).toFixed(1)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progressPct}%`, background: STATUS_COLORS[status] }}
        />
      </div>

      {/* Transaction items */}
      {transactions.length === 0 ? (
        <p className="text-center text-[var(--text-muted)] text-xs py-4">
          No investments this month.
        </p>
      ) : (
        <div className="space-y-0.5">
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center justify-between py-2 px-2 rounded-lg"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full" style={{ background: "#34D399" }} />
                <div>
                  <span className="text-xs font-medium">{txn.fund_name ?? `Fund #${txn.fund_id}`}</span>
                  <p className="text-[10px] text-[var(--text-muted)]">{formatDate(txn.date)}</p>
                </div>
              </div>
              <span className="font-mono-nums text-xs">{formatPKR(Number(txn.amount))}</span>
            </div>
          ))}
        </div>
      )}

      <a
        href="/portfolio"
        className="flex items-center justify-center gap-1.5 mt-3 px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-muted)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors"
      >
        Add Investment <ArrowRight className="w-3 h-3" />
      </a>
    </div>
  );
}

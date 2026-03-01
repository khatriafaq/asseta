"use client";

import { formatPKR } from "@/lib/utils";

interface BudgetBarProps {
  needsTotal: number;
  wantsTotal: number;
  investingTotal: number;
  totalIncome: number;
}

const BUCKET_COLORS = {
  needs: "#38BDF8",
  wants: "#A78BFA",
  investing: "#34D399",
};

export function BudgetBar({ needsTotal, wantsTotal, investingTotal, totalIncome }: BudgetBarProps) {
  if (totalIncome === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Budget Allocation</h3>
        <div className="h-9 rounded-full bg-[var(--bg-elevated)]" />
      </div>
    );
  }

  const needsPct = (needsTotal / totalIncome) * 100;
  const wantsPct = (wantsTotal / totalIncome) * 100;
  const investingPct = (investingTotal / totalIncome) * 100;
  const unallocatedPct = Math.max(0, 100 - needsPct - wantsPct - investingPct);

  const segments = [
    { key: "needs", label: "Needs", pct: needsPct, target: 50, color: BUCKET_COLORS.needs, exceeds: needsPct > 50 },
    { key: "wants", label: "Wants", pct: wantsPct, target: 30, color: BUCKET_COLORS.wants, exceeds: wantsPct > 30 },
    { key: "investing", label: "Investing", pct: investingPct, target: 20, color: BUCKET_COLORS.investing, below: investingPct < 20 },
  ];

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Budget Allocation</h3>

      {/* Labels */}
      <div className="flex flex-wrap gap-4 mb-3 text-xs">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            <span className="font-medium">{s.label}</span>
            <span
              className="font-mono-nums"
              style={{ color: s.exceeds || s.below ? "var(--coral)" : "var(--text-secondary)" }}
            >
              {s.pct.toFixed(1)}%
            </span>
            <span className="text-[var(--text-muted)]">/ {s.target}%</span>
          </div>
        ))}
      </div>

      {/* Bar */}
      <div className="relative h-9 rounded-full overflow-hidden flex bg-[var(--bg-elevated)]">
        {needsPct > 0 && (
          <div
            className="h-full transition-all duration-700 rounded-l-full"
            style={{ width: `${needsPct}%`, background: BUCKET_COLORS.needs }}
          />
        )}
        {wantsPct > 0 && (
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${wantsPct}%`, background: BUCKET_COLORS.wants }}
          />
        )}
        {investingPct > 0 && (
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${investingPct}%`, background: BUCKET_COLORS.investing }}
          />
        )}
        {/* Target markers */}
        <div
          className="absolute top-0 bottom-0 w-px border-l border-dashed border-white/40"
          style={{ left: "50%" }}
        />
        <div
          className="absolute top-0 bottom-0 w-px border-l border-dashed border-white/40"
          style={{ left: "80%" }}
        />
      </div>

      {/* Scale */}
      <div className="flex justify-between mt-1.5 text-[10px] text-[var(--text-muted)] font-mono-nums">
        <span>0</span>
        <span>{formatPKR(totalIncome * 0.5)} (50%)</span>
        <span>{formatPKR(totalIncome * 0.8)} (80%)</span>
        <span>{formatPKR(totalIncome)}</span>
      </div>
    </div>
  );
}

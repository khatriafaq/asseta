"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Crosshair, Zap, Edit3, Check, AlertTriangle, CheckCircle2, Loader2, Building2 } from "lucide-react";
import { formatPKR, formatPercent, cn } from "@/lib/utils";
import { usePortfolioStore } from "@/lib/stores/portfolio-store";
import { useAllocationDrift, useRiskScore } from "@/lib/hooks/use-analytics";
import { useHoldings, useHoldingsByInstitution } from "@/lib/hooks/use-holdings";
import { useTargetAllocation, useSetTargetAllocation, useRebalanceSuggestion } from "@/lib/hooks/use-allocation";
import { RiskScoreCard } from "@/components/allocation/risk-score-card";
import { AIInsightsPanel } from "@/components/allocation/ai-insights-panel";
import type { HoldingGroup, RebalanceSuggestion } from "@/lib/types";

const ALLOCATION_COLORS: Record<string, string> = {
  "Equity Fund": "#34D399", Equity: "#34D399",
  "Debt Fund": "#38BDF8", Debt: "#38BDF8",
  "Money Market Fund": "#FBBF24", "Money Market": "#FBBF24",
  Pension: "#A78BFA",
  "Savings Account": "#FB923C", Savings: "#FB923C",
};

function DriftIndicator({ name, actual, target }: { name: string; actual: number; target: number }) {
  const drift = Math.abs(actual - target);
  const status = drift <= 5 ? "green" : drift <= 10 ? "amber" : "red";
  const direction = actual > target ? "Over" : actual < target ? "Under" : "On target";

  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-2 h-8 rounded-full" style={{
          background: status === "green" ? "var(--jade)" : status === "amber" ? "var(--amber)" : "var(--coral)",
        }} />
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-[11px] text-[var(--text-muted)]">{direction} by {drift.toFixed(1)}pp</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <p className="text-[11px] text-[var(--text-muted)]">Actual</p>
          <p className="font-mono-nums text-sm font-medium">{actual.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-[11px] text-[var(--text-muted)]">Target</p>
          <p className="font-mono-nums text-sm font-medium text-[var(--text-secondary)]">{target}%</p>
        </div>
        <div className="w-6">
          {status === "green" ? (
            <CheckCircle2 className="w-4 h-4 text-[var(--jade)]" />
          ) : (
            <AlertTriangle className="w-4 h-4" style={{ color: status === "amber" ? "var(--amber)" : "var(--coral)" }} />
          )}
        </div>
      </div>
    </div>
  );
}

function SmartRebalance({ portfolioId }: { portfolioId: number }) {
  const [amount, setAmount] = useState("");
  const [suggestions, setSuggestions] = useState<RebalanceSuggestion[] | null>(null);
  const rebalanceMutation = useRebalanceSuggestion(portfolioId);

  const handleSuggest = async () => {
    const parsed = parseFloat(amount.replace(/,/g, ""));
    if (isNaN(parsed) || parsed <= 0) return;
    const result = await rebalanceMutation.mutateAsync(parsed);
    setSuggestions(result);
  };

  return (
    <div className="glass-card p-6 animate-fade-in-up stagger-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--amber)] to-[var(--coral)] flex items-center justify-center">
          <Zap className="w-4 h-4 text-[var(--bg-deep)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>Smart Rebalance</h3>
          <p className="text-[11px] text-[var(--text-muted)]">Minimize drift with your next investment</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">PKR</span>
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              setSuggestions(null);
              setAmount(e.target.value);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
            placeholder="Enter amount to invest"
            aria-label="Investment amount in Pakistani Rupees"
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm font-mono-nums focus:border-[var(--jade)] focus:ring-1 focus:ring-[var(--jade)] outline-none transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>
        <button
          onClick={handleSuggest}
          disabled={rebalanceMutation.isPending || !amount}
          className="px-5 py-3 rounded-xl bg-[var(--jade)] text-[var(--bg-deep)] text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {rebalanceMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Suggest
        </button>
      </div>

      {rebalanceMutation.isError && (
        <p className="text-sm text-[var(--coral)] mb-3">
          Failed to get suggestions. Please try again.
        </p>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--text-muted)]">Based on your targets and current drift:</p>
          {suggestions.map((s) => {
            const isUnderweight = s.drift_pct < 0;
            return (
              <div
                key={s.asset_type}
                className={cn(
                  "py-3 px-4 rounded-xl border transition-all",
                  isUnderweight
                    ? "bg-[var(--bg-elevated)] border-l-4"
                    : "bg-[var(--bg-elevated)]/50 border-[var(--border-subtle)] opacity-60"
                )}
                style={isUnderweight ? { borderLeftColor: ALLOCATION_COLORS[s.asset_type] ?? "#94A3B8" } : undefined}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: ALLOCATION_COLORS[s.asset_type] ?? "#94A3B8" }} />
                      <span className="text-sm font-medium">{s.asset_type}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 ml-4">
                      Currently {(s.current_pct * 100).toFixed(0)}% vs {(s.target_pct * 100).toFixed(0)}% target
                      {isUnderweight && ` (underweight by ${Math.abs(s.drift_pct * 100).toFixed(0)}%)`}
                    </p>
                    {s.recommended_fund_name && (
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 ml-4">
                        Recommended: <span className="font-medium">{s.recommended_fund_name}</span>
                      </p>
                    )}
                    {s.reasoning && (
                      <p className="text-[11px] text-[var(--sky)] mt-1 ml-4 italic">
                        {s.reasoning}
                      </p>
                    )}
                  </div>
                  <span className="font-mono-nums text-sm font-semibold text-[var(--jade)]">
                    {formatPKR(s.suggested_amount)}
                  </span>
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-[var(--text-muted)] pt-2">
            Amounts distributed proportionally to drift magnitude among underweight asset types.
          </p>
        </div>
      )}

      {suggestions && suggestions.length === 0 && (
        <p className="text-sm text-[var(--text-muted)]">
          Set target allocations first to get rebalance suggestions.
        </p>
      )}
    </div>
  );
}

function TargetEditor({ portfolioId, targets: initialTargets, holdingTypes }: { portfolioId: number; targets: { asset_type: string; target_pct: number }[]; holdingTypes: string[] }) {
  const [editing, setEditing] = useState(false);
  const setTargetAllocation = useSetTargetAllocation(portfolioId);

  // Merge: show all fund types from holdings, pre-fill with existing target %
  const targetMap = new Map(initialTargets.map((t) => [t.asset_type, Number(t.target_pct) * 100]));
  const mergedInit = holdingTypes.map((type) => ({
    name: type,
    target: targetMap.get(type) ?? 0,
  }));
  const [targets, setTargets] = useState(mergedInit);

  const total = targets.reduce((s, t) => s + t.target, 0);

  const handleSave = () => {
    setTargetAllocation.mutate(
      targets.map((t) => ({ asset_type: t.name, target_pct: t.target / 100 }))
    );
    setEditing(false);
  };

  return (
    <div className="glass-card p-6 animate-fade-in-up stagger-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">Target Allocation</h3>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            editing ? "bg-[var(--jade)] text-[var(--bg-deep)]" : "border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
          )}
        >
          {editing ? <Check className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
          {editing ? "Save" : "Edit"}
        </button>
      </div>
      <div className="space-y-3">
        {targets.map((t, i) => (
          <div key={t.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: ALLOCATION_COLORS[t.name] ?? "#94A3B8" }} />
              <span className="text-sm">{t.name}</span>
            </div>
            {editing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number" value={t.target}
                  onChange={(e) => {
                    const next = [...targets];
                    next[i] = { ...t, target: parseFloat(e.target.value) || 0 };
                    setTargets(next);
                  }}
                  className="w-16 px-2 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm font-mono-nums text-right focus:border-[var(--jade)] outline-none"
                />
                <span className="text-xs text-[var(--text-muted)]">%</span>
              </div>
            ) : (
              <span className="font-mono-nums text-sm font-medium">{t.target}%</span>
            )}
          </div>
        ))}
      </div>
      {editing && (
        <div className={cn("mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-medium", total === 100 ? "text-[var(--jade)]" : "text-[var(--coral)]")}>
          <span>Total</span>
          <span className="font-mono-nums">{total}%</span>
        </div>
      )}
    </div>
  );
}

const INSTITUTION_COLORS = ["#34D399", "#38BDF8", "#FBBF24", "#A78BFA", "#FB923C", "#F472B6", "#818CF8"];

function InstitutionPerformance({ groups }: { groups: HoldingGroup[] }) {
  const sorted = [...groups].sort((a, b) => b.current_value - a.current_value);
  const totalValue = sorted.reduce((s, g) => s + g.current_value, 0);

  return (
    <div className="glass-card p-6 animate-fade-in-up stagger-5">
      <div className="flex items-center gap-2 mb-5">
        <Building2 className="w-4 h-4 text-[var(--sky)]" />
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          By Institution
        </h3>
      </div>
      <div className="space-y-4">
        {sorted.map((g, i) => {
          const name = g.institution ?? "Unknown";
          const returnPct = g.total_invested > 0 ? (g.gain_loss / g.total_invested) * 100 : 0;
          const weight = totalValue > 0 ? (g.current_value / totalValue) * 100 : 0;
          const color = INSTITUTION_COLORS[i % INSTITUTION_COLORS.length];

          return (
            <div key={name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-sm font-medium">{name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono-nums text-sm font-medium">
                    {formatPKR(g.current_value)}
                  </span>
                  <span
                    className="font-mono-nums text-xs font-medium w-16 text-right"
                    style={{ color: g.gain_loss >= 0 ? "var(--jade)" : "var(--coral)" }}
                  >
                    {g.gain_loss >= 0 ? "+" : ""}{formatPercent(returnPct)}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${weight}%`, background: color }}
                  />
                </div>
                <span className="font-mono-nums text-[11px] text-[var(--text-muted)] w-10 text-right">
                  {weight.toFixed(1)}%
                </span>
              </div>
              {/* Invested / Gain detail */}
              <div className="flex items-center gap-4 pl-[18px] text-[11px] text-[var(--text-muted)]">
                <span>Invested: <span className="font-mono-nums">{formatPKR(g.total_invested)}</span></span>
                <span>
                  {g.gain_loss >= 0 ? "Gain" : "Loss"}: <span className="font-mono-nums" style={{ color: g.gain_loss >= 0 ? "var(--jade)" : "var(--coral)" }}>
                    {g.gain_loss >= 0 ? "+" : ""}{formatPKR(g.gain_loss)}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AllocationPage() {
  const portfolioId = usePortfolioStore((s) => s.activePortfolioId);
  const { data: drift, isLoading: driftLoading } = useAllocationDrift(portfolioId);
  const { data: targets } = useTargetAllocation(portfolioId);
  const { data: holdings } = useHoldings(portfolioId);
  const { data: instGroups } = useHoldingsByInstitution(portfolioId);
  const { data: riskScore } = useRiskScore(portfolioId);

  // Unique fund types from actual holdings
  const holdingTypes = [...new Set((holdings ?? []).map((h) => h.fund_type).filter(Boolean) as string[])].sort();

  if (driftLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--jade)]" />
      </div>
    );
  }

  const chartData = (drift ?? []).map((d) => ({
    name: d.asset_type,
    actual: Number(d.current_pct) * 100,
    target: Number(d.target_pct ?? 0) * 100,
  }));

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Allocation</h2>
        <p className="text-[var(--text-muted)] text-sm mt-1">Monitor your asset allocation against targets</p>
      </div>

      {chartData.length > 0 ? (
        <>
          <div className="glass-card p-6 animate-fade-in-up stagger-1">
            <div className="flex items-center gap-2 mb-6">
              <Crosshair className="w-4 h-4 text-[var(--jade)]" />
              <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">Target vs Actual</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }} barGap={4}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-body)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "12px", fontFamily: "var(--font-mono)", fontSize: "12px" }} formatter={(value) => [`${value}%`, ""]} />
                <Bar dataKey="target" radius={[6, 6, 0, 0]} fill="var(--bg-hover)" barSize={28} name="Target" />
                <Bar dataKey="actual" radius={[6, 6, 0, 0]} barSize={28} name="Actual">
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={ALLOCATION_COLORS[entry.name] ?? "#94A3B8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card p-6 animate-fade-in-up stagger-2">
              <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Drift Status</h3>
              {chartData.map((a) => (
                <DriftIndicator key={a.name} name={a.name} actual={a.actual} target={a.target} />
              ))}
            </div>
            {portfolioId && holdingTypes.length > 0 && (
              <TargetEditor portfolioId={portfolioId} targets={targets ?? []} holdingTypes={holdingTypes} />
            )}
          </div>

          {/* Risk Score Card */}
          {riskScore && <RiskScoreCard riskScore={riskScore} />}

          {/* AI Insights Panel */}
          <AIInsightsPanel />

          {instGroups && instGroups.length > 0 && (
            <InstitutionPerformance groups={instGroups} />
          )}

          {portfolioId && <SmartRebalance portfolioId={portfolioId} />}
        </>
      ) : (
        <div className="glass-card p-12 text-center animate-fade-in-up stagger-1">
          <p className="text-[var(--text-muted)]">Add holdings and set target allocations to see drift analysis</p>
        </div>
      )}
    </div>
  );
}

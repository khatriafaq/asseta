"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Plus,
  Camera,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatPKR, formatPercent, formatCompactPKR } from "@/lib/utils";
import { usePortfolioStore } from "@/lib/stores/portfolio-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { usePortfolioSummary } from "@/lib/hooks/use-portfolios";
import { useHoldings } from "@/lib/hooks/use-holdings";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { useSnapshots, useGenerateSnapshot } from "@/lib/hooks/use-snapshots";
import { useDailyValues, useRecalculateDailyValues } from "@/lib/hooks/use-daily-values";
import { useAllocationDrift } from "@/lib/hooks/use-analytics";
import { useFIDashboard } from "@/lib/hooks/use-fi";
import { AddTransactionSheet } from "@/components/portfolio/add-transaction-sheet";

const ALLOCATION_COLORS: Record<string, string> = {
  "Equity Fund": "#34D399",
  Equity: "#34D399",
  "Debt Fund": "#38BDF8",
  Debt: "#38BDF8",
  "Money Market Fund": "#FBBF24",
  "Money Market": "#FBBF24",
  Pension: "#A78BFA",
  "Savings Account": "#FB923C",
  Savings: "#FB923C",
};

function KPICard({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  accentColor,
  delay,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  accentColor: string;
  delay: string;
}) {
  return (
    <div className={`kpi-card p-5 animate-fade-in-up ${delay}`}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        {trend && trend !== "neutral" && (
          <div
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
            style={{
              color: trend === "up" ? "var(--jade)" : "var(--coral)",
              background: trend === "up" ? "var(--jade-soft)" : "rgba(248, 113, 113, 0.08)",
            }}
          >
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {subValue}
          </div>
        )}
      </div>
      <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="font-mono-nums text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function FIVariantCard({
  label,
  description,
  fiNumber,
  progress,
  color,
  achieved,
}: {
  label: string;
  description: string;
  fiNumber: number;
  progress: number;
  color: string;
  achieved: boolean;
}) {
  const clampedProgress = Math.min(progress * 100, 100);
  return (
    <div className="glass-card-static p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
            {label}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{description}</p>
        </div>
        {achieved && (
          <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg" style={{ color, background: `${color}15` }}>
            <Check className="w-3 h-3" /> Achieved
          </div>
        )}
      </div>
      <div>
        <div className="flex justify-between text-[11px] mb-1">
          <span className="font-mono-nums text-[var(--text-secondary)]">{formatCompactPKR(fiNumber)}</span>
          <span className="font-mono-nums font-medium" style={{ color }}>{clampedProgress.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${clampedProgress}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}

function FIProgressRing({ progress, fiNumber, currentValue, savingsRate }: { progress: number; fiNumber: number; currentValue: number; savingsRate: number }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <div className="glass-card p-6 animate-fade-in-up stagger-5">
      <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
        FI Progress
      </h3>
      <div className="flex items-center gap-6">
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
            <circle
              cx="70" cy="70" r={radius} fill="none" stroke="url(#fi-gradient)" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              className="progress-ring-circle"
            />
            <defs>
              <linearGradient id="fi-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--jade)" />
                <stop offset="100%" stopColor="var(--sky)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono-nums text-2xl font-bold text-[var(--jade)]">
              {(progress * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">of goal</span>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">FI Target</p>
            <p className="font-mono-nums text-lg font-semibold">{formatCompactPKR(fiNumber)}</p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Current</p>
            <p className="font-mono-nums text-lg font-semibold">{formatCompactPKR(currentValue)}</p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Savings Rate</p>
            <p className="font-mono-nums text-lg font-semibold text-[var(--jade)]">
              {(savingsRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PerformanceChart({
  transactions,
  snapshots,
  dailyValues,
  currentValue,
}: {
  transactions: { date: string; transaction_type: string; amount: number }[];
  snapshots: { month: string; snapshot_date: string; total_invested: number; portfolio_value: number }[];
  dailyValues: { date: string; total_invested: number; portfolio_value: number }[];
  currentValue: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const hasDailyData = dailyValues.length > 0;

  let chartData: { date: string; label: string; invested: number; current: number | undefined }[];

  if (hasDailyData) {
    // Use daily values for both lines — smooth, complete data
    chartData = dailyValues.map((dv) => ({
      date: dv.date,
      label: new Date(dv.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
      invested: Number(dv.total_invested),
      current: Number(dv.portfolio_value),
    }));

    // Append today's live value if not already the last point
    const lastDate = chartData[chartData.length - 1]?.date;
    if (lastDate !== today && currentValue > 0) {
      const lastInvested = chartData[chartData.length - 1]?.invested ?? 0;
      chartData.push({
        date: today,
        label: new Date(today).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
        invested: lastInvested,
        current: currentValue,
      });
    }
  } else {
    // Fallback: transaction-based invested line + snapshot current value points
    const sortedTxns = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const investedByDate = new Map<string, number>();
    let cumInvested = 0;
    for (const tx of sortedTxns) {
      if (tx.transaction_type === "Deposit") cumInvested += Number(tx.amount);
      else if (tx.transaction_type === "Withdrawal") cumInvested -= Number(tx.amount);
      investedByDate.set(tx.date, cumInvested);
    }

    const valueByDate = new Map<string, number>();
    for (const s of snapshots) {
      valueByDate.set(s.snapshot_date, Number(s.portfolio_value));
    }

    const allDates = new Set([...investedByDate.keys(), ...valueByDate.keys(), today]);
    const sortedDates = [...allDates].sort();

    let lastInvested = 0;
    chartData = sortedDates.map((date) => {
      if (investedByDate.has(date)) lastInvested = investedByDate.get(date)!;
      const portfolioValue = date === today ? currentValue : valueByDate.get(date) ?? undefined;
      return {
        date,
        label: new Date(date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
        invested: lastInvested,
        current: portfolioValue,
      };
    });
  }

  const hasData = chartData.length > 0 && (chartData[0]?.invested > 0 || chartData[0]?.current !== undefined);

  return (
    <div className="glass-card p-6 animate-fade-in-up stagger-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Portfolio Growth
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--jade)]" />
            <span className="text-[var(--text-muted)]">Current Value</span>
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Invested</span>
          </span>
        </div>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-current" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--jade)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--jade)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-invested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--text-muted)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--text-muted)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-body)" }} interval="preserveStartEnd" />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} tickFormatter={(v) => formatCompactPKR(v)} />
            <Tooltip
              contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "12px", fontFamily: "var(--font-mono)", fontSize: "12px" }}
              labelStyle={{ color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 600 }}
              formatter={(value) => [formatPKR(Number(value ?? 0))]}
            />
            <Area type="stepAfter" dataKey="invested" stroke="var(--text-muted)" strokeWidth={1.5} fill="url(#grad-invested)" strokeDasharray="4 4" connectNulls={false} />
            <Area type="monotone" dataKey="current" stroke="var(--jade)" strokeWidth={2} fill="url(#grad-current)" connectNulls={false} dot={{ r: 3, fill: "var(--jade)" }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[220px] flex items-center justify-center text-sm text-[var(--text-muted)]">
          Add transactions to see growth chart
        </div>
      )}
    </div>
  );
}

function AllocationPie({ driftData }: { driftData: { asset_type: string; current_pct: number; current_value: number }[] }) {
  const chartData = driftData.map((d) => ({
    name: d.asset_type,
    actual: Number(d.current_pct) * 100,
    fill: ALLOCATION_COLORS[d.asset_type] ?? "#94A3B8",
  }));

  return (
    <div className="glass-card p-6 animate-fade-in-up stagger-5">
      <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">
        Allocation
      </h3>
      {chartData.length > 0 ? (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={chartData} innerRadius={42} outerRadius={65} paddingAngle={3} dataKey="actual" strokeWidth={0}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 flex-1">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.fill }} />
                  <span className="text-[var(--text-secondary)]">{item.name}</span>
                </span>
                <span className="font-mono-nums font-medium">{item.actual.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-[140px] flex items-center justify-center text-sm text-[var(--text-muted)]">
          Add holdings to see allocation
        </div>
      )}
    </div>
  );
}

function RecentTransactions({ transactions }: { transactions: { id: number; date: string; transaction_type: string; amount: number; fund_id: number }[] }) {
  return (
    <div className="glass-card p-6 animate-fade-in-up stagger-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Recent Transactions
        </h3>
      </div>
      {transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)] last:border-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      tx.transaction_type === "Deposit" ? "var(--jade-soft)"
                        : tx.transaction_type === "Withdrawal" ? "rgba(248,113,113,0.08)"
                        : tx.transaction_type === "Profit" ? "rgba(56,189,248,0.08)"
                        : "rgba(251,191,36,0.08)",
                  }}
                >
                  {tx.transaction_type === "Deposit" ? (
                    <ArrowDownRight className="w-3.5 h-3.5 text-[var(--jade)]" />
                  ) : tx.transaction_type === "Withdrawal" ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-[var(--coral)]" />
                  ) : tx.transaction_type === "Profit" ? (
                    <DollarSign className="w-3.5 h-3.5 text-[var(--sky)]" />
                  ) : (
                    <DollarSign className="w-3.5 h-3.5 text-[var(--amber)]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{tx.transaction_type}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {new Date(tx.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
              <span
                className="font-mono-nums text-sm font-medium"
                style={{
                  color:
                    tx.transaction_type === "Deposit" ? "var(--jade)"
                      : tx.transaction_type === "Withdrawal" ? "var(--coral)"
                      : tx.transaction_type === "Profit" ? "var(--sky)"
                      : "var(--amber)",
                }}
              >
                {tx.transaction_type === "Withdrawal" ? "-" : "+"}
                {formatPKR(Number(tx.amount))}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-[var(--text-muted)]">
          No transactions yet
        </div>
      )}
    </div>
  );
}

function QuickActions({
  onAddTransaction,
  onTakeSnapshot,
  onViewAnalytics,
  snapshotPending,
  snapshotSuccess,
}: {
  onAddTransaction: () => void;
  onTakeSnapshot: () => void;
  onViewAnalytics: () => void;
  snapshotPending: boolean;
  snapshotSuccess: boolean;
}) {
  const actions = [
    { label: "Add Transaction", icon: Plus, color: "var(--jade)", onClick: onAddTransaction },
    { label: "Take Snapshot", icon: snapshotSuccess ? Check : snapshotPending ? Loader2 : Camera, color: "var(--sky)", onClick: onTakeSnapshot },
    { label: "View Analytics", icon: BarChart3, color: "var(--amber)", onClick: onViewAnalytics },
  ];

  return (
    <div className="flex gap-3 animate-fade-in-up stagger-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          disabled={action.label === "Take Snapshot" && snapshotPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 hover:bg-[var(--bg-elevated)] hover:border-[var(--border-light)] transition-all text-sm font-medium disabled:opacity-50"
        >
          <action.icon className={`w-4 h-4 ${action.label === "Take Snapshot" && snapshotPending ? "animate-spin" : ""}`} style={{ color: action.color }} />
          <span className="hidden sm:inline text-[var(--text-secondary)]">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const portfolioId = usePortfolioStore((s) => s.activePortfolioId);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const { data: summary, isLoading: summaryLoading } = usePortfolioSummary(portfolioId);
  const { data: holdings } = useHoldings(portfolioId);
  const { data: transactions } = useTransactions(portfolioId);
  const { data: snapshots } = useSnapshots(portfolioId);
  const { data: dailyValues } = useDailyValues(portfolioId);
  const recalculate = useRecalculateDailyValues(portfolioId);
  const { data: drift } = useAllocationDrift(portfolioId);
  const { data: fiDashboard } = useFIDashboard();
  const snapshotMutation = useGenerateSnapshot(portfolioId ?? 0);

  const totalInvested = summary?.total_invested ?? 0;
  const currentValue = summary?.current_value ?? 0;
  const gainLoss = summary?.absolute_gain ?? 0;
  const returnPct = (summary?.return_pct ?? 0) * 100;
  const xirr = (summary?.xirr ?? 0) * 100;

  const fiNumber = fiDashboard?.fi_number ?? 0;
  const fiProgress = fiDashboard?.fi_progress_pct ?? 0;
  const savingsRate = fiDashboard?.savings_rate ?? 0;
  const coastFiNumber = fiDashboard?.coast_fi_number ?? 0;
  const coastFiProgress = fiDashboard?.coast_fi_progress_pct ?? 0;
  const baristaFiNumber = fiDashboard?.barista_fi_number ?? 0;
  const baristaFiProgress = fiDashboard?.barista_fi_progress_pct ?? 0;

  // One-time fix: if any daily value record has portfolio_value > currentValue by >5%,
  // manual assets were incorrectly included — recalculate to strip them out.
  useEffect(() => {
    if (!dailyValues?.length || !currentValue || recalculate.isPending || recalculate.isSuccess) return;
    const maxStored = Math.max(...dailyValues.map((dv) => Number(dv.portfolio_value)));
    if (maxStored > currentValue * 1.05) {
      recalculate.mutate();
    }
  }, [dailyValues, currentValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  if (summaryLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--jade)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {greeting}, {user?.name?.split(" ")[0] ?? "there"}
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {holdings && holdings.length > 0 ? (
              <>
                Your portfolio is{" "}
                <span className={gainLoss >= 0 ? "text-[var(--jade)] font-medium" : "text-[var(--coral)] font-medium"}>
                  {gainLoss >= 0 ? "up" : "down"} {formatPercent(returnPct)}
                </span>{" "}
                overall
              </>
            ) : (
              "Add transactions to start tracking your portfolio"
            )}
          </p>
        </div>
        <QuickActions
          onAddTransaction={() => setAddSheetOpen(true)}
          onTakeSnapshot={() => snapshotMutation.mutate()}
          onViewAnalytics={() => router.push("/allocation")}
          snapshotPending={snapshotMutation.isPending}
          snapshotSuccess={snapshotMutation.isSuccess}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Invested" value={formatPKR(totalInvested)} icon={DollarSign} trend="neutral" accentColor="var(--sky)" delay="stagger-1" />
        <KPICard label="Current Value" value={formatPKR(currentValue)} subValue={formatPercent(returnPct)} icon={TrendingUp} trend="up" accentColor="var(--jade)" delay="stagger-2" />
        <KPICard
          label="Total Gain/Loss" value={formatPKR(gainLoss)} subValue={formatPercent(returnPct)}
          icon={gainLoss >= 0 ? TrendingUp : TrendingDown} trend={gainLoss >= 0 ? "up" : "down"}
          accentColor={gainLoss >= 0 ? "var(--jade)" : "var(--coral)"} delay="stagger-3"
        />
        <KPICard label="Portfolio XIRR" value={`${xirr.toFixed(1)}%`} icon={Target} trend="neutral" accentColor="var(--amber)" delay="stagger-4" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PerformanceChart transactions={transactions ?? []} snapshots={snapshots ?? []} dailyValues={dailyValues ?? []} currentValue={currentValue} />
        </div>
        <AllocationPie driftData={drift ?? []} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {fiNumber > 0 && (
          <FIProgressRing progress={fiProgress} fiNumber={fiNumber} currentValue={currentValue} savingsRate={savingsRate} />
        )}
        <RecentTransactions transactions={transactions ?? []} />
      </div>

      {/* FI Variants Row — Coast FI + Barista FI */}
      {fiNumber > 0 && (coastFiNumber > 0 || baristaFiNumber > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up">
          {coastFiNumber > 0 && (
            <FIVariantCard
              label="Coast FI"
              description="Stop contributing — let compounding reach your FI Number"
              fiNumber={coastFiNumber}
              progress={coastFiProgress}
              color="var(--sky)"
              achieved={coastFiProgress >= 1}
            />
          )}
          {baristaFiNumber > 0 && (
            <FIVariantCard
              label="Barista FI"
              description="Semi-retire — part-time income covers the gap"
              fiNumber={baristaFiNumber}
              progress={baristaFiProgress}
              color="var(--amber)"
              achieved={baristaFiProgress >= 1}
            />
          )}
        </div>
      )}

      {/* Add Transaction Sheet */}
      {portfolioId && (
        <AddTransactionSheet
          open={addSheetOpen}
          onClose={() => setAddSheetOpen(false)}
          portfolioId={portfolioId}
          editTransaction={null}
          editFund={null}
        />
      )}
    </div>
  );
}

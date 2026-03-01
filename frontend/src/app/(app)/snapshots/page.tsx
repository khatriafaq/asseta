"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import Link from "next/link";
import {
  Camera,
  Target,
  Loader2,
} from "lucide-react";
import { formatPKR, formatPercent, formatCompactPKR } from "@/lib/utils";
import { usePortfolioStore } from "@/lib/stores/portfolio-store";
import { useSnapshots, useGenerateSnapshot } from "@/lib/hooks/use-snapshots";
import { usePortfolioSummary } from "@/lib/hooks/use-portfolios";
import { useFIDashboard } from "@/lib/hooks/use-fi";

function SnapshotTable({ snapshots }: { snapshots: { month: string; total_invested: number; portfolio_value: number; absolute_gain: number; portfolio_xirr: number | null }[] }) {
  return (
    <div className="glass-card-static p-5 animate-fade-in-up stagger-2 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            {["Month", "Invested", "Value", "Gain/Loss", "Gain %", "XIRR"].map((h) => (
              <th key={h} className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-medium py-3 px-3 text-right first:text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...snapshots].reverse().map((s) => {
            const gainPct = Number(s.total_invested) > 0 ? (Number(s.absolute_gain) / Number(s.total_invested)) * 100 : 0;
            return (
              <tr key={s.month} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]/50 transition-colors">
                <td className="py-3 px-3 text-sm font-medium">
                  {new Date(s.month + "-01").toLocaleDateString("en-PK", { month: "short", year: "numeric" })}
                </td>
                <td className="py-3 px-3 text-right font-mono-nums text-sm">{formatPKR(Number(s.total_invested))}</td>
                <td className="py-3 px-3 text-right font-mono-nums text-sm">{formatPKR(Number(s.portfolio_value))}</td>
                <td className="py-3 px-3 text-right font-mono-nums text-sm font-medium" style={{ color: Number(s.absolute_gain) >= 0 ? "var(--jade)" : "var(--coral)" }}>
                  {formatPKR(Number(s.absolute_gain))}
                </td>
                <td className="py-3 px-3 text-right font-mono-nums text-sm" style={{ color: gainPct >= 0 ? "var(--jade)" : "var(--coral)" }}>
                  {formatPercent(gainPct)}
                </td>
                <td className="py-3 px-3 text-right font-mono-nums text-sm text-[var(--amber)]">
                  {s.portfolio_xirr != null ? `${(Number(s.portfolio_xirr) * 100).toFixed(1)}%` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GrowthChart({ snapshots }: { snapshots: { month: string; total_invested: number; portfolio_value: number }[] }) {
  // API returns newest-first; chart needs oldest-first (left → right)
  const chartData = [...snapshots].reverse().map((s) => ({
    month: new Date(s.month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    invested: Number(s.total_invested),
    current: Number(s.portfolio_value),
  }));

  return (
    <div className="glass-card p-6 animate-fade-in-up stagger-3">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">Growth Over Time</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--jade)]" />
            <span className="text-[var(--text-muted)]">Current</span>
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--sky)]" />
            <span className="text-[var(--text-muted)]">Invested</span>
          </span>
        </div>
      </div>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-snap-current" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--jade)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--jade)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-snap-invested" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--sky)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--sky)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} tickFormatter={(v) => formatCompactPKR(v)} />
            <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "12px", fontSize: "12px" }} formatter={(value) => [formatPKR(value as number), ""]} />
            <Area type="monotone" dataKey="invested" stroke="var(--sky)" strokeWidth={1.5} fill="url(#grad-snap-invested)" />
            <Area type="monotone" dataKey="current" stroke="var(--jade)" strokeWidth={2} fill="url(#grad-snap-current)" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[260px] flex items-center justify-center text-sm text-[var(--text-muted)]">No snapshots yet</div>
      )}
    </div>
  );
}

function FIProjectionChart({ currentValue, fiNumber, xirr, monthlySavings }: { currentValue: number; fiNumber: number; xirr: number; monthlySavings: number }) {
  const growthRate = xirr / 12;
  const projectionData = [];
  let projected = currentValue;
  const now = new Date();
  for (let i = 0; i <= 240; i += 6) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    projectionData.push({
      year: date.toLocaleDateString("en-PK", { year: "2-digit", month: "short" }),
      value: Math.round(projected),
      fi: fiNumber,
    });
    for (let m = 0; m < 6; m++) {
      projected = projected * (1 + growthRate) + monthlySavings;
    }
    if (projected >= fiNumber * 1.2) break;
  }

  const fiMonth = projectionData.findIndex((p) => p.value >= fiNumber);
  const fiDate = fiMonth >= 0 ? projectionData[fiMonth]?.year : "20+ years";

  return (
    <div className="glass-card p-6 animate-fade-in-up stagger-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">FI Projection</h3>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--jade-soft)] text-[var(--jade)] text-xs font-medium">
          <Target className="w-3 h-3" />
          {formatCompactPKR(fiNumber)}
        </div>
      </div>
      <p className="text-[var(--text-muted)] text-xs mb-4">
        Projected FI date: <span className="text-[var(--jade)] font-medium">{fiDate}</span>
        {" "}at {(xirr * 100).toFixed(1)}% XIRR
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={projectionData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }} tickFormatter={(v) => formatCompactPKR(v)} />
          <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", borderRadius: "12px", fontSize: "12px" }} formatter={(value) => [formatPKR(value as number), ""]} />
          <Line type="monotone" dataKey="fi" stroke="var(--amber)" strokeWidth={1} strokeDasharray="6 4" dot={false} name="FI Target" />
          <Line type="monotone" dataKey="value" stroke="var(--jade)" strokeWidth={2} dot={false} name="Projected" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function SnapshotsPage() {
  const portfolioId = usePortfolioStore((s) => s.activePortfolioId);
  const { data: snapshots, isLoading } = useSnapshots(portfolioId);
  const { data: summary } = usePortfolioSummary(portfolioId);
  const { data: fiDashboard } = useFIDashboard();
  const generateSnapshot = useGenerateSnapshot(portfolioId ?? 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--jade)]" />
      </div>
    );
  }

  const currentValue = summary?.current_value ?? 0;
  const xirr = summary?.xirr ?? 0.15;
  const fiNumber = fiDashboard?.fi_number ?? null;
  const fiProgress = fiDashboard?.fi_progress_pct ?? null;
  const monthlySavings = fiDashboard?.savings_amount ?? 0;
  const savingsRate = fiDashboard?.savings_rate ?? 0;
  const fiProfileMissing = fiDashboard != null && fiNumber === null;

  const metrics = [
    { label: "FI Number", value: fiNumber != null && fiNumber > 0 ? formatCompactPKR(fiNumber) : "Not set", sub: "@ 4% SWR", color: "var(--amber)" },
    { label: "Progress", value: fiProgress != null ? `${(fiProgress * 100).toFixed(1)}%` : "—", sub: formatPKR(currentValue), color: "var(--jade)" },
    { label: "Monthly Savings", value: formatPKR(monthlySavings), sub: `${(savingsRate * 100).toFixed(1)}% rate`, color: "var(--sky)" },
    { label: "Portfolio XIRR", value: `${(xirr * 100).toFixed(1)}%`, sub: "annualized", color: "var(--amber)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Snapshots</h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">Track portfolio growth and FI progress over time</p>
        </div>
        <button
          onClick={() => generateSnapshot.mutate()}
          disabled={!portfolioId || generateSnapshot.isPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--jade)] text-[var(--bg-deep)] text-sm font-semibold hover:bg-[var(--jade)]/90 transition-colors shadow-lg shadow-[var(--jade-glow)] disabled:opacity-60"
        >
          {generateSnapshot?.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          Generate Snapshot
        </button>
      </div>

      {/* FI setup banner — only when dashboard loaded but no FI profile */}
      {fiProfileMissing && (
        <div className="glass-card-static p-4 flex items-center gap-3 animate-fade-in-up">
          <Target className="w-4 h-4 text-[var(--amber)] shrink-0" />
          <p className="text-xs text-[var(--text-muted)] flex-1">FI profile not configured — FI Number and Progress unavailable.</p>
          <Link href="/settings" className="text-xs font-semibold text-[var(--jade)] whitespace-nowrap hover:opacity-80 transition-opacity">
            Set Up →
          </Link>
        </div>
      )}

      {/* FI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up stagger-1">
        {metrics.map((m) => (
          <div key={m.label} className="kpi-card p-4">
            <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{m.label}</p>
            <p className="font-mono-nums text-xl font-semibold" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GrowthChart snapshots={snapshots ?? []} />
        {fiNumber > 0 && (
          <FIProjectionChart currentValue={currentValue} fiNumber={fiNumber} xirr={xirr} monthlySavings={monthlySavings} />
        )}
      </div>

      {/* Snapshot History Table */}
      {(snapshots ?? []).length > 0 && (
        <div className="animate-fade-in-up stagger-5">
          <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Snapshot History</h3>
          <SnapshotTable snapshots={snapshots ?? []} />
        </div>
      )}
    </div>
  );
}

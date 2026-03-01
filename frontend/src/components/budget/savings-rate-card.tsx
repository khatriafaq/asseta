"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavingsRateCardProps {
  savingsRate: number;
  trend?: { month: string; rate: number }[];
}

function getSavingsRateColor(rate: number): string {
  if (rate >= 0.3) return "var(--jade)";
  if (rate >= 0.2) return "#FBBF24";
  return "var(--coral)";
}

export function SavingsRateCard({ savingsRate, trend }: SavingsRateCardProps) {
  const color = getSavingsRateColor(savingsRate);
  const pctDisplay = (savingsRate * 100).toFixed(1);

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">Savings Rate</h3>

      <div className="text-center mb-4">
        <p className="font-mono-nums text-4xl font-bold" style={{ color }}>
          {pctDisplay}%
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-1">
          <ArrowRight className="w-3 h-3 inline" /> 20% target (30%+ for FI)
        </p>
      </div>

      {/* Gauge bar */}
      <div className="h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${Math.min(100, (savingsRate / 0.5) * 100)}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-4">
        <span>0%</span>
        <span>20%</span>
        <span>50%</span>
      </div>

      {/* Sparkline trend */}
      {trend && trend.length > 1 && (
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Monthly Trend</p>
          <ResponsiveContainer width="100%" height={50}>
            <LineChart data={trend}>
              <Line
                type="monotone"
                dataKey="rate"
                stroke="var(--jade)"
                strokeWidth={2}
                dot={false}
              />
              <XAxis dataKey="month" hide />
              <YAxis hide domain={[0, "auto"]} />
              <Tooltip
                content={({ payload }) =>
                  payload?.[0] ? (
                    <span className="text-xs font-mono-nums bg-[var(--bg-surface)] px-2 py-1 rounded border border-[var(--border-subtle)]">
                      {Number(payload[0].value).toFixed(1)}%
                    </span>
                  ) : null
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

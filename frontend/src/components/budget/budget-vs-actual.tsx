"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  CartesianGrid,
} from "recharts";
import { formatPKR } from "@/lib/utils";

interface BudgetVsActualProps {
  targets: { needs: number; wants: number; investing: number };
  actuals: { needs: number; wants: number; investing: number };
}

export function BudgetVsActual({ targets, actuals }: BudgetVsActualProps) {
  const chartData = [
    { name: "Needs", target: targets.needs, actual: actuals.needs, fill: "#38BDF8" },
    { name: "Wants", target: targets.wants, actual: actuals.wants, fill: "#A78BFA" },
    { name: "Investing", target: targets.investing, actual: actuals.investing, fill: "#34D399" },
  ];

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">Target vs Actual</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) =>
              v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${(v / 1000).toFixed(0)}K`
            }
            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <Tooltip
            formatter={(value) => formatPKR(Number(value))}
            contentStyle={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="target" name="Target" fill="var(--text-muted)" fillOpacity={0.2} barSize={24} radius={[4, 4, 0, 0]} />
          <Bar dataKey="actual" name="Actual" barSize={24} radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

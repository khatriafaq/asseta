"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { ShieldCheck, ShieldAlert, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskScore } from "@/lib/types";

function getScoreColor(score: number) {
  if (score >= 80) return "var(--jade)";
  if (score >= 60) return "var(--sky)";
  if (score >= 40) return "var(--amber)";
  return "var(--coral)";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Attention";
}

function getGradeColor(grade: string) {
  if (grade === "A") return "var(--jade)";
  if (grade === "B") return "var(--sky)";
  if (grade === "C") return "var(--amber)";
  return "var(--coral)";
}

export function RiskScoreCard({ riskScore }: { riskScore: RiskScore }) {
  const color = getScoreColor(riskScore.health_score);
  const label = getScoreLabel(riskScore.health_score);

  const chartData = [
    {
      name: "score",
      value: riskScore.health_score,
      fill: color,
    },
  ];

  return (
    <div className="glass-card p-6 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-5">
        {riskScore.health_score >= 60 ? (
          <ShieldCheck className="w-4 h-4" style={{ color }} />
        ) : (
          <ShieldAlert className="w-4 h-4" style={{ color }} />
        )}
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Portfolio Health
        </h3>
      </div>

      <div className="flex items-start gap-6">
        {/* Radial gauge */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              startAngle={180}
              endAngle={0}
              data={chartData}
              barSize={10}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={5}
                background={{ fill: "var(--bg-elevated)" }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <span className="font-mono-nums text-2xl font-bold" style={{ color }}>
              {riskScore.health_score}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
              {label}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-3">
          {/* Diversification grade */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">Diversification</span>
            <span
              className="font-mono-nums text-sm font-bold px-2 py-0.5 rounded"
              style={{
                color: getGradeColor(riskScore.diversification_grade),
                background: `color-mix(in srgb, ${getGradeColor(riskScore.diversification_grade)} 15%, transparent)`,
              }}
            >
              Grade {riskScore.diversification_grade}
            </span>
          </div>

          {/* Age appropriate badge */}
          {riskScore.age_appropriate !== null && (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  riskScore.age_appropriate ? "bg-[var(--jade)]" : "bg-[var(--coral)]"
                )}
              />
              <span className="text-xs text-[var(--text-secondary)]">
                {riskScore.age_appropriate_message}
              </span>
            </div>
          )}

          {/* Concentration warnings */}
          {riskScore.concentration_warnings.length > 0 && (
            <div className="space-y-1.5">
              {riskScore.concentration_warnings.map((w) => (
                <div
                  key={`${w.entity_type}-${w.entity}`}
                  className="flex items-start gap-2 text-xs"
                >
                  <AlertTriangle className="w-3 h-3 text-[var(--amber)] flex-shrink-0 mt-0.5" />
                  <span className="text-[var(--text-secondary)]">{w.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Risk factors */}
      {riskScore.risk_factors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-2">
          {riskScore.risk_factors.map((factor, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
              <Info className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
              <span>{factor}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

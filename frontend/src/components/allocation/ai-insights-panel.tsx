"use client";

import { Sparkles, CheckCircle2, AlertTriangle, Lightbulb, Globe, Loader2, Settings } from "lucide-react";
import Link from "next/link";
import { usePortfolioStore } from "@/lib/stores/portfolio-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAIInsights } from "@/lib/hooks/use-analytics";
import type { AIInsight } from "@/lib/types";

function InsightSection({
  title,
  items,
  icon: Icon,
  color,
}: {
  title: string;
  items: string[];
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2" style={{ color }}>
        <Icon className="w-3.5 h-3.5" />
        <h4 className="text-xs font-semibold uppercase tracking-wider">
          {title}
        </h4>
      </div>
      <ul className="space-y-1.5 ml-5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-[var(--text-secondary)] list-disc">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function InsightsContent({ data }: { data: AIInsight }) {
  return (
    <div className="space-y-5">
      {/* Summary */}
      <p className="text-sm text-[var(--text-primary)] leading-relaxed">{data.summary}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InsightSection
          title="Strengths"
          items={data.strengths}
          icon={CheckCircle2}
          color="var(--jade)"
        />
        <InsightSection
          title="Concerns"
          items={data.concerns}
          icon={AlertTriangle}
          color="var(--amber)"
        />
      </div>

      <InsightSection
        title="Recommendations"
        items={data.recommendations}
        icon={Lightbulb}
        color="var(--sky)"
      />

      {data.market_context && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Market Context
            </h4>
          </div>
          <p className="text-sm text-[var(--text-secondary)] ml-5 leading-relaxed">
            {data.market_context}
          </p>
        </div>
      )}
    </div>
  );
}

export function AIInsightsPanel() {
  const portfolioId = usePortfolioStore((s) => s.activePortfolioId);
  const user = useAuthStore((s) => s.user);
  const aiMutation = useAIInsights(portfolioId);
  const hasKey = !!user?.gemini_api_key_masked;

  if (!hasKey) {
    return (
      <div className="glass-card p-6 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              AI Portfolio Analysis
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">Powered by Google Gemini</p>
          </div>
        </div>
        <div className="bg-[var(--bg-elevated)] rounded-xl p-4 text-center">
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Add your Gemini API key in Settings to unlock AI-powered portfolio insights
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-hover)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-all"
          >
            <Settings className="w-4 h-4" />
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              AI Portfolio Analysis
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">Powered by Google Gemini</p>
          </div>
        </div>

        <button
          onClick={() => aiMutation.mutate()}
          disabled={aiMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {aiMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {aiMutation.isPending ? "Analyzing..." : "Analyze My Portfolio"}
        </button>
      </div>

      {aiMutation.isError && (
        <div className="bg-[var(--bg-elevated)] rounded-xl p-4 text-center">
          <p className="text-sm text-[var(--coral)]">
            {(aiMutation.error as Error)?.message?.includes("503")
              ? "AI analysis temporarily unavailable. Please try again later."
              : "Failed to analyze portfolio. Please check your API key in Settings."}
          </p>
        </div>
      )}

      {aiMutation.isPending && !aiMutation.data && (
        <div className="bg-[var(--bg-elevated)] rounded-xl p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center animate-pulse">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Analyzing your portfolio with AI...
            </p>
          </div>
        </div>
      )}

      {aiMutation.data && <InsightsContent data={aiMutation.data} />}
    </div>
  );
}

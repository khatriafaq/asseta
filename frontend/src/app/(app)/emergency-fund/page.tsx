"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Shield,
  Loader2,
  Plus,
  Check,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { formatPKR, cn } from "@/lib/utils";
import {
  useEFDashboard,
  useEFTaggable,
  useUpsertEFConfig,
  useAddEFTag,
  useRemoveEFTag,
} from "@/lib/hooks/use-emergency-fund";
import { SlidePanel } from "@/components/ui/slide-panel";
import type { EmergencyFundTaggableItem } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  critical: "var(--coral)",
  building: "#FBBF24",
  healthy: "var(--jade)",
  strong: "var(--jade)",
};

const STATUS_LABELS: Record<string, string> = {
  critical: "Critical",
  building: "Building",
  healthy: "Healthy",
  strong: "Strong",
};

const TARGET_OPTIONS = [3, 6, 9, 12] as const;

export default function EmergencyFundPage() {
  const { data: dashboard, isLoading } = useEFDashboard();
  const { data: taggable } = useEFTaggable();
  const upsertConfig = useUpsertEFConfig();
  const addTag = useAddEFTag();
  const removeTag = useRemoveEFTag();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--jade)]" />
      </div>
    );
  }

  const d = dashboard!;
  const noExpenses = d.monthly_essential === 0;
  const taggedItems = (taggable ?? []).filter((t) => t.is_tagged);
  const noTags = taggedItems.length === 0;

  // Empty states
  if (noExpenses && noTags) {
    return (
      <div className="space-y-6">
        <Header status={null} />
        <div className="glass-card p-12 text-center animate-fade-in-up stagger-1 space-y-6">
          <Shield className="w-12 h-12 mx-auto text-[var(--text-muted)]" />
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
              Set Up Your Safety Net
            </h3>
            <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
              Two quick steps to get started:
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/budget"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--jade)] text-[var(--bg-deep)] hover:bg-[var(--jade)]/90 transition-colors"
            >
              Step 1: Log Expenses <ArrowRight className="w-4 h-4" />
            </a>
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              Step 2: Tag Accounts <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <TagPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          items={taggable ?? []}
          onTag={handleTag}
          onUntag={handleUntag}
        />
      </div>
    );
  }

  if (noExpenses) {
    return (
      <div className="space-y-6">
        <Header status={null} />
        <div className="glass-card p-12 text-center animate-fade-in-up stagger-1">
          <AlertTriangle className="w-10 h-10 mx-auto text-[#FBBF24] mb-3" />
          <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Missing Expense Data
          </h3>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            Log your monthly expenses in Budget to calculate your emergency fund target.
          </p>
          <a
            href="/budget"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--jade)] text-[var(--bg-deep)] hover:bg-[var(--jade)]/90 transition-colors"
          >
            Go to Budget <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  const progressData = [
    { name: "Covered", value: Math.min(d.progress_pct, 100) },
    { name: "Remaining", value: Math.max(0, 100 - d.progress_pct) },
  ];

  function handleTag(item: EmergencyFundTaggableItem) {
    if (item.type === "holding") {
      addTag.mutate({ holding_id: item.holding_id! });
    } else {
      addTag.mutate({ manual_asset_id: item.manual_asset_id! });
    }
  }

  function handleUntag(item: EmergencyFundTaggableItem) {
    if (item.tag_id) {
      removeTag.mutate(item.tag_id);
    }
  }

  return (
    <div className="space-y-6">
      <Header status={d.status} />

      {/* Progress Ring */}
      <div className="glass-card p-6 animate-fade-in-up stagger-1">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={progressData}
                  innerRadius={50}
                  outerRadius={72}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill={STATUS_COLORS[d.status]} />
                  <Cell fill="var(--bg-elevated)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono-nums text-xl font-bold" style={{ color: STATUS_COLORS[d.status] }}>
                {d.months_covered}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">months</span>
            </div>
          </div>

          {/* Milestone Track */}
          <div className="flex-1 w-full">
            <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-4">Milestones</h3>
            <div className="flex items-center gap-0">
              {d.milestones.map((m, i) => (
                <div key={m.months} className="flex-1 flex flex-col items-center">
                  <div className="flex items-center w-full">
                    {i > 0 && (
                      <div
                        className="flex-1 h-0.5 rounded-full transition-all duration-500"
                        style={{
                          background: d.milestones[i - 1].reached ? STATUS_COLORS[d.status] : "var(--bg-elevated)",
                        }}
                      />
                    )}
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                        m.reached ? "border-transparent" : "border-[var(--border-subtle)]"
                      )}
                      style={{
                        background: m.reached ? STATUS_COLORS[d.status] : "var(--bg-elevated)",
                        boxShadow: m.reached ? `0 0 10px ${STATUS_COLORS[d.status]}40` : "none",
                      }}
                    >
                      {m.reached && <Check className="w-2.5 h-2.5 text-[var(--bg-deep)]" />}
                    </div>
                    {i < d.milestones.length - 1 && (
                      <div
                        className="flex-1 h-0.5 rounded-full transition-all duration-500"
                        style={{
                          background: m.reached ? STATUS_COLORS[d.status] : "var(--bg-elevated)",
                        }}
                      />
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)] mt-1.5 font-mono-nums">{m.months}mo</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics (2x2) */}
      <div className="grid grid-cols-2 gap-4 animate-fade-in-up stagger-2">
        <div className="glass-card p-5">
          <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Monthly Needs</p>
          <p className="font-mono-nums text-lg font-semibold">{formatPKR(d.monthly_essential)}</p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">avg. essential expenses</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Target Amount</p>
          <p className="font-mono-nums text-lg font-semibold">{formatPKR(d.target_amount)}</p>
          <div className="flex gap-1 mt-2">
            {TARGET_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => upsertConfig.mutate({ target_months: m })}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[11px] font-medium transition-all",
                  d.target_months === m
                    ? "bg-[var(--jade-soft)] text-[var(--jade)] border border-[var(--border-jade)]"
                    : "text-[var(--text-muted)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]"
                )}
              >
                {m}mo
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Current Balance</p>
          <p className="font-mono-nums text-lg font-semibold" style={{ color: STATUS_COLORS[d.status] }}>
            {formatPKR(d.current_balance)}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">from {taggedItems.length} tagged account{taggedItems.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
            {d.gap > 0 ? "Gap" : "Surplus"}
          </p>
          <p
            className="font-mono-nums text-lg font-semibold"
            style={{ color: d.gap > 0 ? "var(--coral)" : "var(--jade)" }}
          >
            {d.gap > 0 ? formatPKR(d.gap) + " to go" : formatPKR(Math.abs(d.gap)) + " extra"}
          </p>
        </div>
      </div>

      {/* Tagged Accounts */}
      <div className="glass-card p-6 animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">Tagged Accounts</h3>
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <Plus className="w-3 h-3" /> Tag Account
          </button>
        </div>

        {noTags ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-muted)] text-sm mb-3">
              Tag your savings accounts or liquid funds as emergency reserves
            </p>
            <button
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--jade)] text-[var(--bg-deep)] hover:bg-[var(--jade)]/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Tag Account
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {taggedItems.map((item) => (
              <div key={`${item.type}-${item.holding_id ?? item.manual_asset_id}`} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[var(--bg-elevated)]/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--jade)]" />
                  <span className="text-sm">{item.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{item.asset_type}</span>
                </div>
                <span className="font-mono-nums text-sm">{formatPKR(item.current_value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
              <span className="text-sm font-medium text-[var(--text-muted)]">Total</span>
              <span className="font-mono-nums text-sm font-semibold">{formatPKR(d.current_balance)}</span>
            </div>
          </div>
        )}
      </div>

      <TagPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        items={taggable ?? []}
        onTag={handleTag}
        onUntag={handleUntag}
      />
    </div>
  );
}

function Header({ status }: { status: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          Safety Net
        </h2>
        <p className="text-[var(--text-muted)] text-sm mt-1">Your first line of defence</p>
      </div>
      {status && (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border",
            status === "strong" && "shadow-[0_0_12px_var(--jade-glow)]"
          )}
          style={{
            borderColor: STATUS_COLORS[status] + "40",
            background: STATUS_COLORS[status] + "10",
          }}
        >
          <Shield className="w-4 h-4" style={{ color: STATUS_COLORS[status] }} />
          <span className="text-sm font-medium" style={{ color: STATUS_COLORS[status] }}>
            {STATUS_LABELS[status]}
          </span>
        </div>
      )}
    </div>
  );
}

function TagPicker({
  open,
  onClose,
  items,
  onTag,
  onUntag,
}: {
  open: boolean;
  onClose: () => void;
  items: EmergencyFundTaggableItem[];
  onTag: (item: EmergencyFundTaggableItem) => void;
  onUntag: (item: EmergencyFundTaggableItem) => void;
}) {
  return (
    <SlidePanel open={open} onClose={onClose} title="Tag Accounts">
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Select holdings and assets to earmark as your emergency fund.
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={`${item.type}-${item.holding_id ?? item.manual_asset_id}`}
            onClick={() => (item.is_tagged ? onUntag(item) : onTag(item))}
            className="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-[var(--bg-elevated)]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                  item.is_tagged
                    ? "bg-[var(--jade)] border-[var(--jade)]"
                    : "border-[var(--border-subtle)]"
                )}
              >
                {item.is_tagged && <Check className="w-3 h-3 text-[var(--bg-deep)]" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{item.asset_type}</p>
              </div>
            </div>
            <span className="font-mono-nums text-sm text-[var(--text-secondary)]">
              {formatPKR(item.current_value)}
            </span>
          </button>
        ))}
        {items.length === 0 && (
          <p className="text-center text-[var(--text-muted)] text-sm py-8">
            No holdings or assets found. Add investments in Portfolio first.
          </p>
        )}
      </div>
    </SlidePanel>
  );
}

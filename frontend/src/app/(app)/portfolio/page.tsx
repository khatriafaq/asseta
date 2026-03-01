"use client";

import { useState, Fragment } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Search,
  Plus,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  DollarSign,
  Building2,
  Layers,
  List,
  X,
  Loader2,
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { refreshNavs, getNavStatus } from "@/lib/api/admin";
import { formatPKR, formatPercent, cn } from "@/lib/utils";
import { usePortfolioStore } from "@/lib/stores/portfolio-store";
import { useHoldings } from "@/lib/hooks/use-holdings";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { AddTransactionSheet } from "@/components/portfolio/add-transaction-sheet";
import { DeleteConfirmDialog } from "@/components/portfolio/delete-confirm-dialog";
import { ExcelImportDialog } from "@/components/portfolio/excel-import-dialog";
import type { Holding, Transaction, FundBrief } from "@/lib/types";

type ViewMode = "fund" | "institution" | "type";
type Tab = "holdings" | "transactions";

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const options: { value: ViewMode; icon: React.ElementType; label: string }[] = [
    { value: "fund", icon: List, label: "Fund" },
    { value: "institution", icon: Building2, label: "Institution" },
    { value: "type", icon: Layers, label: "Type" },
  ];

  return (
    <div className="flex rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all",
            mode === opt.value
              ? "bg-[var(--jade-soft)] text-[var(--jade)] border-r border-[var(--border-jade)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
          )}
        >
          <opt.icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function HoldingsTable({ viewMode, holdings }: { viewMode: ViewMode; holdings: Holding[] }) {
  const [sortField, setSortField] = useState<string>("current_value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const totalValue = holdings.reduce((s, h) => s + Number(h.current_value), 0);

  const withWeight = holdings.map((h) => ({
    ...h,
    weight: totalValue > 0 ? (Number(h.current_value) / totalValue) * 100 : 0,
  }));

  const sorted = [...withWeight].sort((a, b) => {
    const aVal = Number(a[sortField as keyof typeof a] ?? 0);
    const bVal = Number(b[sortField as keyof typeof b] ?? 0);
    return sortDir === "desc" ? bVal - aVal : aVal - bVal;
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const grouped = viewMode !== "fund"
    ? Object.entries(
        sorted.reduce((acc, h) => {
          const key = viewMode === "institution" ? (h.institution_name ?? "Unknown") : (h.fund_type ?? "Unknown");
          if (!acc[key]) acc[key] = [];
          acc[key].push(h);
          return acc;
        }, {} as Record<string, typeof sorted>)
      )
    : null;

  const SortHeader = ({ field, children, align = "left" }: { field: string; children: React.ReactNode; align?: "left" | "right" | "center" }) => (
    <button
      onClick={() => toggleSort(field)}
      className={cn(
        "flex items-center gap-1 text-[11px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors font-medium",
        align === "right" && "ml-auto",
        align === "center" && "mx-auto",
      )}
    >
      {children}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  const renderRow = (h: typeof sorted[0]) => {
    const navVal = h.current_nav != null ? Number(h.current_nav) : null;
    const navChg = h.nav_change != null ? Number(h.nav_change) : null;

    return (
      <tr key={h.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]/50 transition-colors">
        <td className="py-3.5 pr-4">
          <div>
            <p className="text-sm font-medium">{h.fund_name ?? `Fund #${h.fund_id}`}</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {h.fund_type ?? ""} &middot; {h.institution_name ?? ""}
            </p>
          </div>
        </td>
        <td className="py-3.5 px-3 text-right font-mono-nums text-sm hidden lg:table-cell">
          {Number(h.units_held).toFixed(2)}
        </td>
        <td className="py-3.5 px-3 text-right font-mono-nums text-sm hidden lg:table-cell">
          {Number(h.avg_cost_per_unit).toFixed(2)}
        </td>
        <td className="py-3.5 px-3 text-right hidden md:table-cell">
          {navVal != null ? (
            <div className="flex items-center justify-end gap-1">
              <span className="font-mono-nums text-sm">{navVal.toFixed(2)}</span>
              {navChg != null ? (
                navChg > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--jade)]" />
                ) : navChg < 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5 text-[var(--coral)]" />
                ) : (
                  <Minus className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                )
              ) : null}
            </div>
          ) : (
            <span className="text-[var(--text-muted)] text-sm">—</span>
          )}
        </td>
        <td className="py-3.5 px-3 text-right font-mono-nums text-sm hidden md:table-cell">
          {formatPKR(Number(h.total_invested))}
        </td>
        <td className="py-3.5 px-3 text-right font-mono-nums text-sm">
          {formatPKR(Number(h.current_value))}
        </td>
        <td className="py-3.5 px-3 text-right">
          <span className="font-mono-nums text-sm font-medium" style={{ color: Number(h.gain_loss) >= 0 ? "var(--jade)" : "var(--coral)" }}>
            {formatPKR(Number(h.gain_loss))}
          </span>
          <p className="text-[11px] font-mono-nums" style={{ color: Number(h.gain_loss) >= 0 ? "var(--jade)" : "var(--coral)" }}>
            {formatPercent(Number(h.return_pct) * 100)}
          </p>
        </td>
        <td className="py-3.5 pl-3 hidden sm:table-cell">
          <div className="flex items-center justify-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--jade)]" style={{ width: `${h.weight}%` }} />
            </div>
            <span className="font-mono-nums text-xs text-[var(--text-muted)] w-10 text-right">
              {h.weight.toFixed(1)}%
            </span>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            <th className="text-left py-3 pr-4"><SortHeader field="fund_name">Fund</SortHeader></th>
            <th className="text-right py-3 px-3 hidden lg:table-cell"><SortHeader field="units_held" align="right">Units</SortHeader></th>
            <th className="text-right py-3 px-3 hidden lg:table-cell"><SortHeader field="avg_cost_per_unit" align="right">Avg Cost</SortHeader></th>
            <th className="text-right py-3 px-3 hidden md:table-cell"><SortHeader field="current_nav" align="right">NAV</SortHeader></th>
            <th className="text-right py-3 px-3 hidden md:table-cell"><SortHeader field="total_invested" align="right">Invested</SortHeader></th>
            <th className="text-right py-3 px-3"><SortHeader field="current_value" align="right">Value</SortHeader></th>
            <th className="text-right py-3 px-3"><SortHeader field="gain_loss" align="right">Gain/Loss</SortHeader></th>
            <th className="text-center py-3 pl-3 hidden sm:table-cell"><SortHeader field="weight" align="center">Weight</SortHeader></th>
          </tr>
        </thead>
        <tbody>
          {grouped
            ? grouped.map(([group, items]) => (
                <Fragment key={group}>
                  <tr>
                    <td colSpan={8} className="pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-[var(--jade)]">
                      {group}
                      <span className="text-[var(--text-muted)] ml-2 font-normal">
                        ({items.length} fund{items.length > 1 ? "s" : ""})
                      </span>
                      <span className="text-[var(--text-muted)] ml-3 font-normal normal-case">
                        · Invested: <span className="font-mono-nums">{formatPKR(items.reduce((s, h) => s + Number(h.total_invested), 0))}</span>
                      </span>
                    </td>
                  </tr>
                  {items.map(renderRow)}
                </Fragment>
              ))
            : sorted.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

function TransactionHistory({ transactions, onEdit, onDelete }: TransactionHistoryProps) {
  return (
    <div className="space-y-2">
      {transactions.length > 0 ? (
        transactions.map((tx) => (
          <div key={tx.id} className="group flex items-center justify-between py-3 px-4 rounded-xl hover:bg-[var(--bg-elevated)]/50 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    tx.transaction_type === "Deposit" ? "var(--jade-soft)"
                      : tx.transaction_type === "Withdrawal" ? "rgba(248,113,113,0.08)"
                      : tx.transaction_type === "Profit" ? "rgba(56,189,248,0.08)"
                      : "rgba(251,191,36,0.08)",
                }}
              >
                {tx.transaction_type === "Deposit" ? (
                  <ArrowDownRight className="w-4 h-4 text-[var(--jade)]" />
                ) : tx.transaction_type === "Withdrawal" ? (
                  <ArrowUpRight className="w-4 h-4 text-[var(--coral)]" />
                ) : tx.transaction_type === "Profit" ? (
                  <DollarSign className="w-4 h-4 text-[var(--sky)]" />
                ) : (
                  <DollarSign className="w-4 h-4 text-[var(--amber)]" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{tx.fund_name ?? `Fund #${tx.fund_id}`}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {tx.transaction_type} &middot; {new Date(tx.date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                  {tx.institution_name ? ` · ${tx.institution_name}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Action buttons — visible on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(tx)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>
                <button
                  onClick={() => onDelete(tx)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[var(--coral)]" />
                </button>
              </div>
              <div className="text-right">
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
                {tx.transaction_type === "Profit" ? (
                  <p className="text-[11px] font-medium text-[var(--text-muted)]">
                    Profit on deposit
                  </p>
                ) : (
                  <p className="text-[11px] font-medium text-[var(--text-muted)]">
                    {Number(tx.units).toFixed(2)} units @ {Number(tx.price_per_unit).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">No transactions yet</p>
          <p className="text-xs text-[var(--text-faint)] mt-1">
            Import your Excel tracker or add a transaction to get started.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PortfolioPage() {
  const portfolioId = usePortfolioStore((s) => s.activePortfolioId);
  const { data: holdings, isLoading: holdingsLoading } = useHoldings(portfolioId);
  const { data: transactions, isLoading: txnsLoading } = useTransactions(portfolioId);

  const [viewMode, setViewMode] = useState<ViewMode>("fund");
  const [tab, setTab] = useState<Tab>("holdings");
  const [searchOpen, setSearchOpen] = useState(false);

  const queryClient = useQueryClient();
  const { data: navStatus } = useQuery({
    queryKey: ["nav-status"],
    queryFn: getNavStatus,
  });
  const navRefreshMutation = useMutation({
    mutationFn: refreshNavs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holdings"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] });
      queryClient.invalidateQueries({ queryKey: ["funds"] });
      queryClient.invalidateQueries({ queryKey: ["nav-status"] });
    },
  });

  const navLastUpdated = navStatus?.last_updated ? new Date(navStatus.last_updated) : null;
  const navIsStale = navLastUpdated
    ? Date.now() - navLastUpdated.getTime() > 72 * 60 * 60 * 1000
    : false;
  const navDateLabel = navLastUpdated
    ? navLastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  const navDateFull = navLastUpdated
    ? navLastUpdated.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : undefined;

  // Transaction CRUD state
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const totalValue = (holdings ?? []).reduce((sum, h) => sum + Number(h.current_value), 0);
  const totalGain = (holdings ?? []).reduce((sum, h) => sum + Number(h.gain_loss), 0);
  const totalInvested = totalValue - totalGain;

  // Build a FundBrief for edit mode from holdings data
  const editFund: FundBrief | null = editTransaction
    ? (() => {
        const h = (holdings ?? []).find((h) => h.fund_id === editTransaction.fund_id);
        if (!h) return null;
        return {
          id: h.fund_id,
          scheme_key: "",
          name: h.fund_name ?? `Fund #${h.fund_id}`,
          fund_type: h.fund_type ?? "",
          current_nav: null,
          return_ytd: null,
          is_shariah_compliant: false,
        };
      })()
    : null;

  if (!portfolioId || holdingsLoading || txnsLoading) {
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
            Portfolio
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {(holdings ?? []).length} holdings &middot;{" "}
            <span className="font-mono-nums">{formatPKR(totalValue)}</span>{" "}
            {totalInvested > 0 && (
              <span className={totalGain >= 0 ? "text-[var(--jade)]" : "text-[var(--coral)]"}>
                ({formatPercent((totalGain / totalInvested) * 100)})
              </span>
            )}
            {navDateLabel && (
              <>
                {" "}&middot;{" "}
                <span
                  title={navDateFull}
                  style={{ color: navIsStale ? "var(--amber)" : undefined }}
                  className="cursor-default"
                >
                  Prices updated {navDateLabel}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddSheetOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--jade)] text-[var(--bg-deep)] text-sm font-semibold hover:bg-[var(--jade)]/90 transition-colors shadow-lg shadow-[var(--jade-glow)]"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
          <button
            onClick={() => navRefreshMutation.mutate()}
            disabled={navRefreshMutation.isPending}
            className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"
            title="Refresh NAVs from MUFAP"
          >
            <RefreshCw className={cn("w-4 h-4 text-[var(--text-muted)]", navRefreshMutation.isPending && "animate-spin")} />
          </button>
          <button
            onClick={() => setImportDialogOpen(true)}
            className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors"
            title="Import from Excel"
          >
            <Download className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Tabs + Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up stagger-1">
        <div className="flex rounded-xl border border-[var(--border-subtle)] overflow-hidden">
          {(["holdings", "transactions"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-5 py-2.5 text-sm font-medium transition-all capitalize",
                tab === t
                  ? "bg-[var(--jade-soft)] text-[var(--jade)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {tab === "holdings" && <ViewToggle mode={viewMode} onChange={setViewMode} />}
          <div className="relative">
            {searchOpen ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-jade)] bg-[var(--bg-elevated)]">
                <Search className="w-4 h-4 text-[var(--jade)]" />
                <input
                  autoFocus
                  placeholder="Search funds..."
                  className="bg-transparent text-sm outline-none w-32 placeholder:text-[var(--text-muted)]"
                />
                <button onClick={() => setSearchOpen(false)}>
                  <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <Search className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            )}
          </div>
          <button className="p-2.5 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors">
            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="glass-card-static p-5 animate-fade-in-up stagger-2">
        {tab === "holdings" ? (
          <HoldingsTable viewMode={viewMode} holdings={holdings ?? []} />
        ) : (
          <TransactionHistory
            transactions={transactions ?? []}
            onEdit={(tx) => {
              setEditTransaction(tx);
              setAddSheetOpen(true);
            }}
            onDelete={(tx) => setDeleteTransaction(tx)}
          />
        )}
      </div>

      {/* Modals / Sheets */}
      {portfolioId && (
        <>
          <AddTransactionSheet
            open={addSheetOpen}
            onClose={() => {
              setAddSheetOpen(false);
              setEditTransaction(null);
            }}
            portfolioId={portfolioId}
            editTransaction={editTransaction}
            editFund={editFund}
          />
          <DeleteConfirmDialog
            open={!!deleteTransaction}
            onClose={() => setDeleteTransaction(null)}
            portfolioId={portfolioId}
            transaction={deleteTransaction}
          />
          <ExcelImportDialog
            open={importDialogOpen}
            onClose={() => setImportDialogOpen(false)}
            portfolioId={portfolioId}
          />
        </>
      )}
    </div>
  );
}

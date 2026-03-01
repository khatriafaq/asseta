"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { formatPKR, cn } from "@/lib/utils";
import { getCategoryConfig } from "@/lib/constants/expense-categories";
import { AddExpenseDialog } from "./add-expense-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/lib/hooks/use-budget";
import type { Expense } from "@/lib/types";

interface ExpenseBucketSectionProps {
  title: string;
  bucket: "needs" | "wants";
  expenses: Expense[];
  totalIncome: number;
  targetPct: number;
  month: string;
  color: string;
}

function getStatus(pct: number, targetPct: number, bucket: "needs" | "wants") {
  if (bucket === "needs") {
    if (pct <= targetPct) return "good";
    if (pct <= targetPct + 0.05) return "warning";
    return "danger";
  }
  // wants
  if (pct <= targetPct) return "good";
  if (pct <= targetPct + 0.05) return "warning";
  return "danger";
}

const STATUS_COLORS = {
  good: "var(--jade)",
  warning: "#FBBF24",
  danger: "var(--coral)",
};

export function ExpenseBucketSection({
  title,
  bucket,
  expenses,
  totalIncome,
  targetPct,
  month,
  color,
}: ExpenseBucketSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const budgetAmount = totalIncome * targetPct;
  const pct = totalIncome > 0 ? total / totalIncome : 0;
  const status = getStatus(pct, targetPct, bucket);
  const progressPct = budgetAmount > 0 ? Math.min(100, (total / budgetAmount) * 100) : 0;

  const handleAdd = (data: { category: string; amount: number; is_essential: boolean; notes?: string }) => {
    createMutation.mutate(
      { month, category: data.category, amount: data.amount, is_essential: data.is_essential, notes: data.notes },
      { onSuccess: () => setDialogOpen(false) }
    );
  };

  const handleEdit = (data: { category: string; amount: number; is_essential: boolean; notes?: string }) => {
    if (!editingExpense) return;
    updateMutation.mutate(
      { id: editingExpense.id, data: { category: data.category, amount: data.amount, notes: data.notes } },
      { onSuccess: () => setEditingExpense(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-[10px] text-[var(--text-muted)]">{(targetPct * 100).toFixed(0)}% target</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {/* Amount + percentage */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-mono-nums text-lg font-semibold">{formatPKR(total)}</span>
        <span className="text-[11px] text-[var(--text-muted)]">/ {formatPKR(budgetAmount)}</span>
        <span
          className="font-mono-nums text-xs font-medium ml-auto"
          style={{ color: STATUS_COLORS[status] }}
        >
          {(pct * 100).toFixed(1)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progressPct}%`, background: STATUS_COLORS[status] }}
        />
      </div>

      {/* Expense items */}
      {expenses.length === 0 ? (
        <p className="text-center text-[var(--text-muted)] text-xs py-4">
          No {bucket === "needs" ? "essential expenses" : "wants"} logged yet.
        </p>
      ) : (
        <div className="space-y-0.5">
          {expenses.map((exp) => {
            const config = getCategoryConfig(exp.category);
            const Icon = config?.icon ?? MoreHorizontal;
            return (
              <div
                key={exp.id}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[var(--bg-elevated)]/50 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <div>
                    <span className="text-xs font-medium capitalize">{config?.label ?? exp.category}</span>
                    {exp.notes && (
                      <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">{exp.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-nums text-xs">{formatPKR(Number(exp.amount))}</span>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === exp.id ? null : exp.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-elevated)] transition-all"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </button>
                    {menuOpen === exp.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div
                          className="absolute right-0 top-7 z-20 w-28 rounded-xl py-1 shadow-lg"
                          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                        >
                          <button
                            onClick={() => { setEditingExpense(exp); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => { setDeleteTarget(exp); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-[var(--coral)] hover:bg-[var(--bg-elevated)] transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddExpenseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleAdd}
        loading={createMutation.isPending}
        bucket={bucket}
      />

      {editingExpense && (
        <AddExpenseDialog
          open={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          onSubmit={handleEdit}
          loading={updateMutation.isPending}
          bucket={bucket}
          title={bucket === "needs" ? "Edit Need" : "Edit Want"}
          initial={{
            category: editingExpense.category,
            amount: Number(editingExpense.amount),
            notes: editingExpense.notes ?? undefined,
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteMutation.isPending}
      >
        Delete <strong className="capitalize">{deleteTarget?.category}</strong> expense of{" "}
        <strong>{deleteTarget ? formatPKR(Number(deleteTarget.amount)) : ""}</strong>?
      </ConfirmDialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { formatPKR, cn } from "@/lib/utils";
import { getSourceConfig, INCOME_SOURCES } from "@/lib/constants/income-sources";
import { AddIncomeDialog } from "./add-income-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCreateIncome, useUpdateIncome, useDeleteIncome } from "@/lib/hooks/use-budget";
import type { Income } from "@/lib/types";

interface IncomeSectionProps {
  incomes: Income[];
  month: string;
}

export function IncomeSection({ incomes, month }: IncomeSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Income | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const createMutation = useCreateIncome();
  const updateMutation = useUpdateIncome();
  const deleteMutation = useDeleteIncome();

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const activeIncome = incomes.filter((i) => !i.is_passive).reduce((s, i) => s + Number(i.amount), 0);
  const passiveIncome = incomes.filter((i) => i.is_passive).reduce((s, i) => s + Number(i.amount), 0);

  const handleAdd = (data: { source: string; amount: number; is_passive: boolean; notes?: string }) => {
    createMutation.mutate(
      { month, source: data.source, amount: data.amount, is_passive: data.is_passive, notes: data.notes },
      { onSuccess: () => setDialogOpen(false) }
    );
  };

  const handleEdit = (data: { source: string; amount: number; is_passive: boolean; notes?: string }) => {
    if (!editingIncome) return;
    updateMutation.mutate(
      { id: editingIncome.id, data: { source: data.source, amount: data.amount, is_passive: data.is_passive, notes: data.notes } },
      { onSuccess: () => setEditingIncome(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">Monthly Income</h3>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Income
        </button>
      </div>

      <p className="font-mono-nums text-2xl font-semibold text-[var(--jade)] mb-1">{formatPKR(totalIncome)}</p>
      {totalIncome > 0 && (
        <p className="text-[11px] text-[var(--text-muted)] mb-4">
          Active: {formatPKR(activeIncome)} &middot; Passive: {formatPKR(passiveIncome)}
        </p>
      )}

      <div className="space-y-1">
        {incomes.map((inc) => {
          const config = getSourceConfig(inc.source);
          const Icon = config?.icon ?? INCOME_SOURCES[0].icon;
          return (
            <div
              key={inc.id}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[var(--bg-elevated)]/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-[var(--text-muted)]" />
                <div>
                  <span className="text-sm font-medium capitalize">{config?.label ?? inc.source}</span>
                  {inc.is_passive && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[var(--jade-soft)] text-[var(--jade)]">
                      Passive
                    </span>
                  )}
                  {inc.notes && (
                    <p className="text-[10px] text-[var(--text-muted)]">{inc.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono-nums text-sm">{formatPKR(Number(inc.amount))}</span>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === inc.id ? null : inc.id)}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-elevated)] transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4 text-[var(--text-muted)]" />
                  </button>
                  {menuOpen === inc.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div
                        className="absolute right-0 top-8 z-20 w-32 rounded-xl py-1 shadow-lg"
                        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
                      >
                        <button
                          onClick={() => { setEditingIncome(inc); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(inc); setMenuOpen(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--coral)] hover:bg-[var(--bg-elevated)] transition-colors"
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

      <AddIncomeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleAdd}
        loading={createMutation.isPending}
      />

      {editingIncome && (
        <AddIncomeDialog
          open={!!editingIncome}
          onClose={() => setEditingIncome(null)}
          onSubmit={handleEdit}
          loading={updateMutation.isPending}
          title="Edit Income"
          initial={{
            source: editingIncome.source,
            amount: Number(editingIncome.amount),
            is_passive: editingIncome.is_passive,
            notes: editingIncome.notes ?? undefined,
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Income"
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteMutation.isPending}
      >
        Are you sure you want to delete this{" "}
        <strong className="capitalize">{deleteTarget?.source}</strong> income entry of{" "}
        <strong>{deleteTarget ? formatPKR(Number(deleteTarget.amount)) : ""}</strong>?
      </ConfirmDialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { NEEDS_CATEGORIES, WANTS_CATEGORIES, type ExpenseCategoryConfig } from "@/lib/constants/expense-categories";
import { cn } from "@/lib/utils";

interface AddExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    category: string;
    amount: number;
    is_essential: boolean;
    notes?: string;
  }) => void;
  loading?: boolean;
  bucket: "needs" | "wants";
  initial?: {
    category: string;
    amount: number;
    notes?: string;
  };
  title?: string;
}

export function AddExpenseDialog({
  open,
  onClose,
  onSubmit,
  loading = false,
  bucket,
  initial,
  title,
}: AddExpenseDialogProps) {
  const categories: ExpenseCategoryConfig[] =
    bucket === "needs" ? NEEDS_CATEGORIES : WANTS_CATEGORIES;
  const [category, setCategory] = useState(initial?.category ?? categories[0]?.key ?? "");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  useEffect(() => {
    if (open) {
      setCategory(initial?.category ?? categories[0]?.key ?? "");
      setAmount(initial?.amount?.toString() ?? "");
      setNotes(initial?.notes ?? "");
    }
  }, [open]);

  const dialogTitle = title ?? (bucket === "needs" ? "Add Need" : "Add Want");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    onSubmit({
      category,
      amount: parsed,
      is_essential: bucket === "needs",
      notes: notes || undefined,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => !loading && onClose()}
      />
      <div
        className="relative w-full max-w-md mx-4 p-6 rounded-2xl animate-fade-in-up"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {dialogTitle}
          </h3>
          <button onClick={onClose} disabled={loading} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    category === c.key
                      ? bucket === "needs"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                      : "text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]"
                  )}
                >
                  <c.icon className="w-3.5 h-3.5" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Amount (PKR)
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="40,000"
              required
              min="1"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-sm font-mono-nums focus:outline-none focus:border-[var(--jade)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Monthly rent payment"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-sm focus:outline-none focus:border-[var(--jade)] transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--jade)] text-[var(--bg-deep)] hover:bg-[var(--jade)]/90 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {dialogTitle}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

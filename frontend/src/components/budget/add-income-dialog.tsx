"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { INCOME_SOURCES } from "@/lib/constants/income-sources";
import { cn } from "@/lib/utils";

interface AddIncomeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    source: string;
    amount: number;
    is_passive: boolean;
    notes?: string;
  }) => void;
  loading?: boolean;
  initial?: {
    source: string;
    amount: number;
    is_passive: boolean;
    notes?: string;
  };
  title?: string;
}

export function AddIncomeDialog({
  open,
  onClose,
  onSubmit,
  loading = false,
  initial,
  title = "Add Income",
}: AddIncomeDialogProps) {
  const [source, setSource] = useState(initial?.source ?? "salary");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [isPassive, setIsPassive] = useState(initial?.is_passive ?? false);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  useEffect(() => {
    if (open) {
      setSource(initial?.source ?? "salary");
      setAmount(initial?.amount?.toString() ?? "");
      setIsPassive(initial?.is_passive ?? false);
      setNotes(initial?.notes ?? "");
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    onSubmit({ source, amount: parsed, is_passive: isPassive, notes: notes || undefined });
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
            {title}
          </h3>
          <button onClick={onClose} disabled={loading} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Source
            </label>
            <div className="flex flex-wrap gap-2">
              {INCOME_SOURCES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSource(s.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                    source === s.key
                      ? "bg-[var(--jade-soft)] text-[var(--jade)] border-[var(--border-jade)]"
                      : "text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]"
                  )}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.label}
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
              placeholder="150,000"
              required
              min="1"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-sm font-mono-nums focus:outline-none focus:border-[var(--jade)] transition-colors"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Passive Income?</p>
              <p className="text-[10px] text-[var(--text-muted)]">Counts toward FI progress</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPassive(!isPassive)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative",
                isPassive ? "bg-[var(--jade)]" : "bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                  isPassive ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Web development project"
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
              {title}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

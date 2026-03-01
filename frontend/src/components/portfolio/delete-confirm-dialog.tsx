"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteTransaction } from "@/lib/hooks/use-transactions";
import { formatPKR } from "@/lib/utils";
import type { Transaction } from "@/lib/types";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  portfolioId: number;
  transaction: Transaction | null;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  portfolioId,
  transaction,
}: DeleteConfirmDialogProps) {
  const deleteMutation = useDeleteTransaction(portfolioId);

  const handleConfirm = async () => {
    if (!transaction) return;
    await deleteMutation.mutateAsync(transaction.id);
    onClose();
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Transaction"
      confirmLabel="Delete"
      confirmVariant="danger"
      loading={deleteMutation.isPending}
    >
      {transaction && (
        <div className="space-y-2">
          <p>Are you sure you want to delete this transaction? This cannot be undone.</p>
          <div
            className="p-3 rounded-xl text-sm"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Type</span>
              <span className="font-medium">{transaction.transaction_type}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[var(--text-muted)]">Date</span>
              <span className="font-mono-nums">
                {new Date(transaction.date).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[var(--text-muted)]">Amount</span>
              <span className="font-mono-nums font-medium">
                {formatPKR(Number(transaction.amount))}
              </span>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialog>
  );
}

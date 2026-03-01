"use client";

import { useState } from "react";
import { SlidePanel } from "@/components/ui/slide-panel";
import { TransactionForm } from "./transaction-form";
import type { TransactionFormData } from "./transaction-form";
import type { Transaction, FundBrief } from "@/lib/types";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "@/lib/hooks/use-transactions";

interface AddTransactionSheetProps {
  open: boolean;
  onClose: () => void;
  portfolioId: number;
  editTransaction?: Transaction | null;
  editFund?: FundBrief | null;
}

export function AddTransactionSheet({
  open,
  onClose,
  portfolioId,
  editTransaction,
  editFund,
}: AddTransactionSheetProps) {
  const createMutation = useCreateTransaction(portfolioId);
  const updateMutation = useUpdateTransaction(portfolioId);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!editTransaction;

  const handleSubmit = async (data: TransactionFormData) => {
    setError(null);
    try {
      if (isEdit && editTransaction) {
        await updateMutation.mutateAsync({
          txnId: editTransaction.id,
          payload: {
            date: data.date,
            transaction_type: data.transaction_type,
            units: data.units,
            price_per_unit: data.price_per_unit,
            amount: data.amount,
          },
        });
      } else {
        await createMutation.mutateAsync({
          fund_id: data.fund_id,
          date: data.date,
          transaction_type: data.transaction_type,
          units: data.units,
          price_per_unit: data.price_per_unit,
          amount: data.amount,
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : err instanceof Error
            ? err.message
            : "Something went wrong";
      setError(msg ?? "Something went wrong");
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <SlidePanel
      open={open}
      onClose={handleClose}
      title={isEdit ? "Edit Transaction" : "Add Transaction"}
    >
      {error && (
        <div
          className="mb-4 px-3 py-2.5 rounded-xl text-sm text-[var(--coral)]"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}
        >
          {error}
        </div>
      )}
      <TransactionForm
        key={editTransaction?.id ?? "new"}
        editTransaction={(editTransaction ?? undefined) as any}
        editFund={editFund}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </SlidePanel>
  );
}

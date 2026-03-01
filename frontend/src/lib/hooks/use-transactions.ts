import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  importExcel,
} from "@/lib/api/transactions";
import type { TransactionCreate, TransactionUpdate } from "@/lib/types";

function errMsg(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? fallback;
}

export function useTransactions(portfolioId: number | null) {
  return useQuery({
    queryKey: ["transactions", portfolioId],
    queryFn: () => listTransactions(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useCreateTransaction(portfolioId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransactionCreate) =>
      createTransaction(portfolioId, payload),
    onSuccess: () => {
      toast.success("Transaction added");
      queryClient.invalidateQueries({ queryKey: ["transactions", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["holdings", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-summary", portfolioId] });
    },
    onError: (err) => toast.error(errMsg(err, "Failed to add transaction")),
  });
}

export function useUpdateTransaction(portfolioId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ txnId, payload }: { txnId: number; payload: TransactionUpdate }) =>
      updateTransaction(portfolioId, txnId, payload),
    onSuccess: () => {
      toast.success("Transaction updated");
      queryClient.invalidateQueries({ queryKey: ["transactions", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["holdings", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-summary", portfolioId] });
    },
    onError: (err) => toast.error(errMsg(err, "Failed to update transaction")),
  });
}

export function useDeleteTransaction(portfolioId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (txnId: number) => deleteTransaction(portfolioId, txnId),
    onSuccess: () => {
      toast.success("Transaction deleted");
      queryClient.invalidateQueries({ queryKey: ["transactions", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["holdings", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-summary", portfolioId] });
    },
    onError: (err) => toast.error(errMsg(err, "Failed to delete transaction")),
  });
}

export function useImportExcel(portfolioId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importExcel(portfolioId, file),
    onSuccess: () => {
      toast.success("Excel data imported successfully");
      queryClient.invalidateQueries({ queryKey: ["transactions", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["holdings", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-summary", portfolioId] });
    },
    onError: (err) => toast.error(errMsg(err, "Excel import failed")),
  });
}

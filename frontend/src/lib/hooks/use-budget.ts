import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listIncome,
  createIncome,
  updateIncome,
  deleteIncome,
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} from "@/lib/api/budget";
import type { IncomeCreate, ExpenseCreate } from "@/lib/types";

// ─── Income ──────────────────────────────────────────────────

export function useIncome(month?: string) {
  return useQuery({
    queryKey: ["income", month],
    queryFn: () => listIncome(month),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IncomeCreate) => createIncome(payload),
    onSuccess: () => {
      toast.success("Income added");
      queryClient.invalidateQueries({ queryKey: ["income"] });
      queryClient.invalidateQueries({ queryKey: ["fi-dashboard"] });
    },
    onError: () => toast.error("Failed to add income"),
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<IncomeCreate> }) =>
      updateIncome(id, data),
    onSuccess: () => {
      toast.success("Income updated");
      queryClient.invalidateQueries({ queryKey: ["income"] });
      queryClient.invalidateQueries({ queryKey: ["fi-dashboard"] });
    },
    onError: () => toast.error("Failed to update income"),
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteIncome(id),
    onSuccess: () => {
      toast.success("Income deleted");
      queryClient.invalidateQueries({ queryKey: ["income"] });
      queryClient.invalidateQueries({ queryKey: ["fi-dashboard"] });
    },
    onError: () => toast.error("Failed to delete income"),
  });
}

// ─── Expenses ────────────────────────────────────────────────

export function useExpenses(month?: string) {
  return useQuery({
    queryKey: ["expenses", month],
    queryFn: () => listExpenses(month),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExpenseCreate) => createExpense(payload),
    onSuccess: () => {
      toast.success("Expense added");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
      queryClient.invalidateQueries({ queryKey: ["fi-dashboard"] });
    },
    onError: () => toast.error("Failed to add expense"),
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ExpenseCreate> }) =>
      updateExpense(id, data),
    onSuccess: () => {
      toast.success("Expense updated");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
      queryClient.invalidateQueries({ queryKey: ["fi-dashboard"] });
    },
    onError: () => toast.error("Failed to update expense"),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteExpense(id),
    onSuccess: () => {
      toast.success("Expense deleted");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
      queryClient.invalidateQueries({ queryKey: ["fi-dashboard"] });
    },
    onError: () => toast.error("Failed to delete expense"),
  });
}

export function useExpenseSummary(month?: string) {
  return useQuery({
    queryKey: ["expense-summary", month],
    queryFn: () => getExpenseSummary(month),
  });
}

import api from "./client";
import type {
  Income,
  IncomeCreate,
  Expense,
  ExpenseCreate,
  ExpenseSummary,
} from "@/lib/types";

// ─── Income ───────────────────────────────────────────────────

export async function listIncome(month?: string): Promise<Income[]> {
  const { data } = await api.get<Income[]>("/fi/income/", {
    params: month ? { month } : undefined,
  });
  return data;
}

export async function createIncome(payload: IncomeCreate): Promise<Income> {
  const { data } = await api.post<Income>("/fi/income/", payload);
  return data;
}

export async function updateIncome(
  id: number,
  payload: Partial<IncomeCreate>
): Promise<Income> {
  const { data } = await api.patch<Income>(`/fi/income/${id}`, payload);
  return data;
}

export async function deleteIncome(id: number): Promise<void> {
  await api.delete(`/fi/income/${id}`);
}

// ─── Expenses ─────────────────────────────────────────────────

export async function listExpenses(month?: string, category?: string): Promise<Expense[]> {
  const { data } = await api.get<Expense[]>("/fi/expenses/", {
    params: { ...(month && { month }), ...(category && { category }) },
  });
  return data;
}

export async function createExpense(payload: ExpenseCreate): Promise<Expense> {
  const { data } = await api.post<Expense>("/fi/expenses/", payload);
  return data;
}

export async function updateExpense(
  id: number,
  payload: Partial<ExpenseCreate>
): Promise<Expense> {
  const { data } = await api.patch<Expense>(`/fi/expenses/${id}`, payload);
  return data;
}

export async function deleteExpense(id: number): Promise<void> {
  await api.delete(`/fi/expenses/${id}`);
}

export async function getExpenseSummary(month?: string): Promise<ExpenseSummary> {
  const { data } = await api.get<ExpenseSummary>("/fi/expenses/summary", {
    params: month ? { month } : undefined,
  });
  return data;
}

import api from "./client";
import type { Transaction, TransactionCreate, TransactionUpdate, ImportSummary } from "@/lib/types";

export async function listTransactions(portfolioId: number): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>(
    `/portfolios/${portfolioId}/transactions/`
  );
  return data;
}

export async function createTransaction(
  portfolioId: number,
  payload: TransactionCreate
): Promise<Transaction> {
  const { data } = await api.post<Transaction>(
    `/portfolios/${portfolioId}/transactions/`,
    payload
  );
  return data;
}

export async function deleteTransaction(
  portfolioId: number,
  txnId: number
): Promise<void> {
  await api.delete(`/portfolios/${portfolioId}/transactions/${txnId}`);
}

export async function updateTransaction(
  portfolioId: number,
  txnId: number,
  payload: TransactionUpdate
): Promise<Transaction> {
  const { data } = await api.patch<Transaction>(
    `/portfolios/${portfolioId}/transactions/${txnId}`,
    payload
  );
  return data;
}

export async function importExcel(
  portfolioId: number,
  file: File
): Promise<ImportSummary> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<ImportSummary>(
    `/portfolios/${portfolioId}/import`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function bulkCreateTransactions(
  portfolioId: number,
  transactions: TransactionCreate[]
): Promise<Transaction[]> {
  const { data } = await api.post<Transaction[]>(
    `/portfolios/${portfolioId}/transactions/bulk`,
    transactions
  );
  return data;
}

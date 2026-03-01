import api from "./client";
import type { DailyValue } from "@/lib/types";

export async function listDailyValues(portfolioId: number): Promise<DailyValue[]> {
  const { data } = await api.get<DailyValue[]>(
    `/portfolios/${portfolioId}/daily-values/`
  );
  return data;
}

export async function recalculateDailyValues(portfolioId: number): Promise<{ fixed: number }> {
  const { data } = await api.post<{ fixed: number }>(
    `/portfolios/${portfolioId}/daily-values/recalculate`
  );
  return data;
}

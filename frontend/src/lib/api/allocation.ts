import api from "./client";
import type { TargetAllocation, TargetAllocationSet, RebalanceSuggestion } from "@/lib/types";

export async function getTargetAllocation(
  portfolioId: number
): Promise<TargetAllocation[]> {
  const { data } = await api.get<TargetAllocation[]>(
    `/portfolios/${portfolioId}/target-allocation/`
  );
  return data;
}

export async function setTargetAllocation(
  portfolioId: number,
  allocations: TargetAllocationSet[]
): Promise<TargetAllocation[]> {
  const { data } = await api.put<TargetAllocation[]>(
    `/portfolios/${portfolioId}/target-allocation/`,
    allocations
  );
  return data;
}

export async function getRebalanceSuggestion(
  portfolioId: number,
  amount: number
): Promise<RebalanceSuggestion[]> {
  const { data } = await api.post<RebalanceSuggestion[]>(
    `/portfolios/${portfolioId}/analytics/rebalance-suggestion`,
    { amount }
  );
  return data;
}

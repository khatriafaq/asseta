import api from "./client";
import type { PortfolioReturns, AllocationDrift, RiskScore, AIInsight } from "@/lib/types";

export async function getPortfolioReturns(portfolioId: number): Promise<PortfolioReturns> {
  const { data } = await api.get<PortfolioReturns>(
    `/portfolios/${portfolioId}/analytics/returns`
  );
  return data;
}

export async function getAllocationDrift(portfolioId: number): Promise<AllocationDrift[]> {
  const { data } = await api.get<AllocationDrift[]>(
    `/portfolios/${portfolioId}/analytics/allocation-drift`
  );
  return data;
}

export async function getRiskScore(portfolioId: number): Promise<RiskScore> {
  const { data } = await api.get<RiskScore>(
    `/portfolios/${portfolioId}/analytics/risk-score`
  );
  return data;
}

export async function getAIInsights(portfolioId: number): Promise<AIInsight> {
  const { data } = await api.post<AIInsight>(
    `/portfolios/${portfolioId}/analytics/ai-insights`
  );
  return data;
}

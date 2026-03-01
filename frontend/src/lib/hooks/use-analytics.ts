import { useQuery, useMutation } from "@tanstack/react-query";
import { getPortfolioReturns, getAllocationDrift, getRiskScore, getAIInsights } from "@/lib/api/analytics";

export function usePortfolioReturns(portfolioId: number | null) {
  return useQuery({
    queryKey: ["analytics-returns", portfolioId],
    queryFn: () => getPortfolioReturns(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useAllocationDrift(portfolioId: number | null) {
  return useQuery({
    queryKey: ["allocation-drift", portfolioId],
    queryFn: () => getAllocationDrift(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useRiskScore(portfolioId: number | null) {
  return useQuery({
    queryKey: ["risk-score", portfolioId],
    queryFn: () => getRiskScore(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useAIInsights(portfolioId: number | null) {
  return useMutation({
    mutationFn: () => getAIInsights(portfolioId!),
  });
}

import { useQuery } from "@tanstack/react-query";
import {
  listHoldings,
  holdingsByInstitution,
  holdingsByAssetType,
} from "@/lib/api/holdings";

export function useHoldings(portfolioId: number | null) {
  return useQuery({
    queryKey: ["holdings", portfolioId],
    queryFn: () => listHoldings(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useHoldingsByInstitution(portfolioId: number | null) {
  return useQuery({
    queryKey: ["holdings-by-institution", portfolioId],
    queryFn: () => holdingsByInstitution(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useHoldingsByAssetType(portfolioId: number | null) {
  return useQuery({
    queryKey: ["holdings-by-asset-type", portfolioId],
    queryFn: () => holdingsByAssetType(portfolioId!),
    enabled: !!portfolioId,
  });
}

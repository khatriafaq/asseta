import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPortfolios,
  createPortfolio,
  getPortfolioSummary,
} from "@/lib/api/portfolios";
import { usePortfolioStore } from "@/lib/stores/portfolio-store";
import { useEffect, useRef } from "react";
import type { PortfolioCreate } from "@/lib/types";

export function usePortfolios() {
  const setActivePortfolio = usePortfolioStore((s) => s.setActivePortfolio);
  const activeId = usePortfolioStore((s) => s.activePortfolioId);
  const queryClient = useQueryClient();
  const autoCreating = useRef(false);

  const query = useQuery({
    queryKey: ["portfolios"],
    queryFn: listPortfolios,
  });

  // Auto-create a default portfolio if none exist, then auto-select
  useEffect(() => {
    if (query.data && query.data.length === 0 && !autoCreating.current) {
      autoCreating.current = true;
      createPortfolio({ name: "My Portfolio", is_default: true }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      });
    }
    if (query.data && query.data.length > 0 && !activeId) {
      const defaultPortfolio = query.data.find((p) => p.is_default) ?? query.data[0];
      setActivePortfolio(defaultPortfolio.id);
    }
  }, [query.data, activeId, setActivePortfolio, queryClient]);

  return query;
}

export function usePortfolioSummary(portfolioId: number | null) {
  return useQuery({
    queryKey: ["portfolio-summary", portfolioId],
    queryFn: () => getPortfolioSummary(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PortfolioCreate) => createPortfolio(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });
}

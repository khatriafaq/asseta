import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listDailyValues, recalculateDailyValues } from "@/lib/api/daily-values";

export function useDailyValues(portfolioId: number | null) {
  return useQuery({
    queryKey: ["daily-values", portfolioId],
    queryFn: () => listDailyValues(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useRecalculateDailyValues(portfolioId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => recalculateDailyValues(portfolioId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-values", portfolioId] });
    },
    onError: () => toast.error("Failed to recalculate chart data"),
  });
}

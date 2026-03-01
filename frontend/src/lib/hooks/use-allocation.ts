import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTargetAllocation, setTargetAllocation, getRebalanceSuggestion } from "@/lib/api/allocation";
import type { TargetAllocationSet, RebalanceSuggestion } from "@/lib/types";

export function useTargetAllocation(portfolioId: number | null) {
  return useQuery({
    queryKey: ["target-allocation", portfolioId],
    queryFn: () => getTargetAllocation(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useSetTargetAllocation(portfolioId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (allocations: TargetAllocationSet[]) =>
      setTargetAllocation(portfolioId, allocations),
    onSuccess: () => {
      toast.success("Target allocation saved");
      queryClient.invalidateQueries({ queryKey: ["target-allocation", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["allocation-drift", portfolioId] });
    },
    onError: () => toast.error("Failed to save target allocation"),
  });
}

export function useRebalanceSuggestion(portfolioId: number) {
  return useMutation<RebalanceSuggestion[], Error, number>({
    mutationFn: (amount: number) =>
      getRebalanceSuggestion(portfolioId, amount),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listSnapshots, generateSnapshot } from "@/lib/api/snapshots";
import { generateNetWorth } from "@/lib/api/fi";

export function useSnapshots(portfolioId: number | null) {
  return useQuery({
    queryKey: ["snapshots", portfolioId],
    queryFn: () => listSnapshots(portfolioId!),
    enabled: !!portfolioId,
  });
}

export function useGenerateSnapshot(portfolioId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const snap = await generateSnapshot(portfolioId);
      await generateNetWorth();
      return snap;
    },
    onSuccess: () => {
      toast.success("Snapshot generated");
      queryClient.invalidateQueries({ queryKey: ["snapshots", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["fi-dashboard"] });
    },
    onError: () => toast.error("Failed to generate snapshot"),
  });
}

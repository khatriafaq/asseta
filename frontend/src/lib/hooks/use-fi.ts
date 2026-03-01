import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getFIProfile,
  upsertFIProfile,
  getFIDashboard,
  listNetWorth,
  getFIProjection,
} from "@/lib/api/fi";
import type { FIProfileUpdate } from "@/lib/types";

export function useFIProfile() {
  return useQuery({
    queryKey: ["fi-profile"],
    queryFn: getFIProfile,
  });
}

export function useUpsertFIProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: FIProfileUpdate) => upsertFIProfile(payload),
    onSuccess: () => {
      toast.success("FI profile saved");
      queryClient.invalidateQueries({ queryKey: ["fi-profile"] });
      queryClient.invalidateQueries({ queryKey: ["fi-dashboard"] });
    },
    onError: () => toast.error("Failed to save FI profile"),
  });
}

export function useFIDashboard() {
  return useQuery({
    queryKey: ["fi-dashboard"],
    queryFn: getFIDashboard,
  });
}

export function useNetWorth() {
  return useQuery({
    queryKey: ["fi-networth"],
    queryFn: listNetWorth,
  });
}

export function useFIProjection() {
  return useQuery({
    queryKey: ["fi-projection"],
    queryFn: getFIProjection,
  });
}

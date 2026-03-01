import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getEFConfig,
  upsertEFConfig,
  getEFDashboard,
  getEFTaggable,
  addEFTag,
  removeEFTag,
} from "@/lib/api/emergency-fund";
import type { EmergencyFundConfigUpdate, EmergencyFundTagCreate } from "@/lib/types";

export function useEFConfig() {
  return useQuery({
    queryKey: ["ef-config"],
    queryFn: getEFConfig,
  });
}

export function useUpsertEFConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmergencyFundConfigUpdate) => upsertEFConfig(payload),
    onSuccess: () => {
      toast.success("Emergency fund target updated");
      queryClient.invalidateQueries({ queryKey: ["ef-config"] });
      queryClient.invalidateQueries({ queryKey: ["ef-dashboard"] });
    },
    onError: () => toast.error("Failed to update emergency fund target"),
  });
}

export function useEFDashboard() {
  return useQuery({
    queryKey: ["ef-dashboard"],
    queryFn: getEFDashboard,
  });
}

export function useEFTaggable() {
  return useQuery({
    queryKey: ["ef-taggable"],
    queryFn: getEFTaggable,
  });
}

export function useAddEFTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmergencyFundTagCreate) => addEFTag(payload),
    onSuccess: () => {
      toast.success("Tagged as emergency fund");
      queryClient.invalidateQueries({ queryKey: ["ef-taggable"] });
      queryClient.invalidateQueries({ queryKey: ["ef-dashboard"] });
    },
    onError: () => toast.error("Failed to tag as emergency fund"),
  });
}

export function useRemoveEFTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: number) => removeEFTag(tagId),
    onSuccess: () => {
      toast.success("Emergency fund tag removed");
      queryClient.invalidateQueries({ queryKey: ["ef-taggable"] });
      queryClient.invalidateQueries({ queryKey: ["ef-dashboard"] });
    },
    onError: () => toast.error("Failed to remove tag"),
  });
}

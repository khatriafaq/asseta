import api from "./client";
import type {
  EmergencyFundConfig,
  EmergencyFundConfigUpdate,
  EmergencyFundDashboard,
  EmergencyFundTaggableItem,
  EmergencyFundTagCreate,
} from "@/lib/types";

export async function getEFConfig(): Promise<EmergencyFundConfig | null> {
  const { data } = await api.get<EmergencyFundConfig | null>("/emergency-fund/config");
  return data;
}

export async function upsertEFConfig(payload: EmergencyFundConfigUpdate): Promise<EmergencyFundConfig> {
  const { data } = await api.put<EmergencyFundConfig>("/emergency-fund/config", payload);
  return data;
}

export async function getEFDashboard(): Promise<EmergencyFundDashboard> {
  const { data } = await api.get<EmergencyFundDashboard>("/emergency-fund/dashboard");
  return data;
}

export async function getEFTaggable(): Promise<EmergencyFundTaggableItem[]> {
  const { data } = await api.get<EmergencyFundTaggableItem[]>("/emergency-fund/taggable");
  return data;
}

export async function addEFTag(payload: EmergencyFundTagCreate): Promise<void> {
  await api.post("/emergency-fund/tags", payload);
}

export async function removeEFTag(tagId: number): Promise<void> {
  await api.delete(`/emergency-fund/tags/${tagId}`);
}

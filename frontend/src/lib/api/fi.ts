import api from "./client";
import type {
  FIProfile,
  FIProfileUpdate,
  FIDashboard,
  NetWorthSnapshot,
} from "@/lib/types";

export async function getFIProfile(): Promise<FIProfile | null> {
  const { data } = await api.get<FIProfile | null>("/fi/profile");
  return data;
}

export async function upsertFIProfile(payload: FIProfileUpdate): Promise<FIProfile> {
  const { data } = await api.put<FIProfile>("/fi/profile", payload);
  return data;
}

export async function getFIDashboard(): Promise<FIDashboard> {
  const { data } = await api.get<FIDashboard>("/fi/dashboard");
  return data;
}

export async function listNetWorth(): Promise<NetWorthSnapshot[]> {
  const { data } = await api.get<NetWorthSnapshot[]>("/fi/networth");
  return data;
}

export async function generateNetWorth(): Promise<NetWorthSnapshot> {
  const { data } = await api.post<NetWorthSnapshot>("/fi/networth/generate");
  return data;
}

export async function getFIProjection(): Promise<Record<string, unknown>> {
  const { data } = await api.get("/fi/projection");
  return data;
}

export async function getFIWhatIf(params: {
  monthly_savings?: number;
  expected_return?: number;
  inflation?: number;
}): Promise<Record<string, unknown>> {
  const { data } = await api.get("/fi/what-if", { params });
  return data;
}

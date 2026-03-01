import api from "./client";
import type { FundBrief, FundCreate } from "@/lib/types";

export async function searchFunds(
  q: string,
  limit: number = 20
): Promise<FundBrief[]> {
  const { data } = await api.get<FundBrief[]>("/funds/", {
    params: { q, limit },
  });
  return data;
}

export async function createFund(payload: FundCreate): Promise<FundBrief> {
  const { data } = await api.post<FundBrief>("/funds/", payload);
  return data;
}

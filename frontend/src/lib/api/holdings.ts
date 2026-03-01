import api from "./client";
import type { Holding, HoldingGroup } from "@/lib/types";

export async function listHoldings(portfolioId: number): Promise<Holding[]> {
  const { data } = await api.get<Holding[]>(`/portfolios/${portfolioId}/holdings/`);
  return data;
}

export async function holdingsByInstitution(portfolioId: number): Promise<HoldingGroup[]> {
  const { data } = await api.get<HoldingGroup[]>(
    `/portfolios/${portfolioId}/holdings/by-institution`
  );
  return data;
}

export async function holdingsByAssetType(portfolioId: number): Promise<HoldingGroup[]> {
  const { data } = await api.get<HoldingGroup[]>(
    `/portfolios/${portfolioId}/holdings/by-asset-type`
  );
  return data;
}

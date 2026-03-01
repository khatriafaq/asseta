import api from "./client";
import type {
  Portfolio,
  PortfolioCreate,
  PortfolioUpdate,
  PortfolioReturns,
} from "@/lib/types";

export async function listPortfolios(): Promise<Portfolio[]> {
  const { data } = await api.get<Portfolio[]>("/portfolios/");
  return data;
}

export async function createPortfolio(payload: PortfolioCreate): Promise<Portfolio> {
  const { data } = await api.post<Portfolio>("/portfolios/", payload);
  return data;
}

export async function getPortfolio(id: number): Promise<Portfolio> {
  const { data } = await api.get<Portfolio>(`/portfolios/${id}`);
  return data;
}

export async function updatePortfolio(id: number, payload: PortfolioUpdate): Promise<Portfolio> {
  const { data } = await api.patch<Portfolio>(`/portfolios/${id}`, payload);
  return data;
}

export async function deletePortfolio(id: number): Promise<void> {
  await api.delete(`/portfolios/${id}`);
}

export async function getPortfolioSummary(id: number): Promise<PortfolioReturns> {
  const { data } = await api.get<PortfolioReturns>(`/portfolios/${id}/summary`);
  return data;
}

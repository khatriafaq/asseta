import api from "./client";
import type { Snapshot } from "@/lib/types";

export async function listSnapshots(portfolioId: number): Promise<Snapshot[]> {
  const { data } = await api.get<Snapshot[]>(
    `/portfolios/${portfolioId}/snapshots/`
  );
  return data;
}

export async function generateSnapshot(portfolioId: number): Promise<Snapshot> {
  const { data } = await api.post<Snapshot>(
    `/portfolios/${portfolioId}/snapshots/generate`
  );
  return data;
}

import api from "./client";

export interface RefreshNavsResult {
  scraped: number;
  matched: number;
  updated: number;
  holdings_recalculated: number;
  error?: string;
}

export async function refreshNavs(): Promise<RefreshNavsResult> {
  const { data } = await api.post<RefreshNavsResult>("/admin/refresh-navs");
  return data;
}

export interface NavStatusResult {
  last_updated: string | null;
  funds_with_nav: number;
}

export async function getNavStatus(): Promise<NavStatusResult> {
  const { data } = await api.get<NavStatusResult>("/admin/nav-status");
  return data;
}

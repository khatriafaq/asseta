import { create } from "zustand";

interface PortfolioState {
  activePortfolioId: number | null;
  setActivePortfolio: (id: number) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  activePortfolioId: null,
  setActivePortfolio: (id) => set({ activePortfolioId: id }),
}));

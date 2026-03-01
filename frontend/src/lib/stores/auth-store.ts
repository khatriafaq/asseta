import { create } from "zustand";
import type { User } from "@/lib/types";
import { login as apiLogin, signup as apiSignup, getMe } from "@/lib/api/auth";
import { setTokens, clearTokens, getAccessToken } from "@/lib/api/client";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const response = await apiLogin(email, password);
    setTokens(response.access_token, response.refresh_token);
    const user = await getMe();
    set({ user, isAuthenticated: true, isLoading: false });
  },

  signup: async (name, email, password) => {
    await apiSignup({ name, email, password });
    // Auto-login after signup
    const response = await apiLogin(email, password);
    setTokens(response.access_token, response.refresh_token);
    const user = await getMe();
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

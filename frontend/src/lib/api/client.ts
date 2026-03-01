import axios from "axios";
import type { RefreshResponse } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// ─── Token helpers ────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// ─── Request interceptor — attach Bearer token ───────────────

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — refresh on 401 ───────────────────

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry auth endpoints or already retried requests
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post<RefreshResponse>(
        `${API_URL}/auth/refresh`,
        null,
        { params: { token: refreshToken } }
      );
      localStorage.setItem("access_token", data.access_token);
      processQueue(null, data.access_token);
      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

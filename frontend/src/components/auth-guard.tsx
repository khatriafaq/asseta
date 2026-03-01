"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--jade)] to-[var(--jade-dim)] animate-pulse" />
          <p className="text-sm text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

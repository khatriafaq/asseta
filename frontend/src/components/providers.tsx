"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";

function AuthLoader({ children }: { children: React.ReactNode }) {
  const loadUser = useAuthStore((s) => s.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthLoader>{children}</AuthLoader>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
          },
        }}
      />
    </QueryClientProvider>
  );
}

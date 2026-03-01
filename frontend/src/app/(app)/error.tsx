"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="glass-card max-w-md w-full p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--coral)]/10 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-[var(--coral)]" />
        </div>
        <h2
          className="text-xl font-bold mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Failed to load page
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Something went wrong loading this page. Please try again.
        </p>
        {error.message && (
          <p className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] p-3 rounded-xl mb-6 break-words">
            {error.message}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--jade)] text-[var(--bg-deep)] text-sm font-semibold hover:opacity-90 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-all"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

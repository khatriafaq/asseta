"use client";

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  loading = false,
}: ConfirmDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    },
    [onClose, loading]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const isDanger = confirmVariant === "danger";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => !loading && onClose()}
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-md mx-4 p-6 rounded-2xl animate-fade-in-up"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h3
          className="text-lg font-semibold mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>
        <div className="text-sm text-[var(--text-secondary)] mb-6">{children}</div>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            style={{
              background: isDanger ? "var(--coral)" : "var(--jade)",
              color: "var(--bg-deep)",
            }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

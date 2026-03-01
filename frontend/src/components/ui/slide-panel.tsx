"use client";

import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function SlidePanel({ open, onClose, title, children }: SlidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
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

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="absolute top-0 right-0 h-full w-full max-w-lg animate-slide-in-right"
        style={{
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-subtle)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6" style={{ height: "calc(100% - 65px)" }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

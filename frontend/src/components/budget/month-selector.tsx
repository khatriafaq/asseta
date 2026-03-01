"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthSelectorProps {
  selectedMonth: string;
  onChange: (month: string) => void;
}

export function MonthSelector({ selectedMonth, onChange }: MonthSelectorProps) {
  const [year, monthNum] = selectedMonth.split("-").map(Number);
  const date = new Date(year, monthNum - 1);
  const label = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);

  const goToPrev = () => {
    const prev = new Date(year, monthNum - 2);
    onChange(
      `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const goToNext = () => {
    const next = new Date(year, monthNum);
    onChange(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isCurrentMonth = selectedMonth === currentMonthStr;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={goToPrev}
        className="p-2 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors"
        aria-label="Go to previous month"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span
        className="text-lg font-semibold min-w-[180px] text-center"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {label}
      </span>
      <button
        onClick={goToNext}
        disabled={isCurrentMonth}
        className={cn(
          "p-2 rounded-lg border border-[var(--border-subtle)] transition-colors",
          isCurrentMonth
            ? "opacity-40 cursor-not-allowed"
            : "hover:bg-[var(--bg-elevated)]"
        )}
        aria-label="Go to next month"
        aria-disabled={isCurrentMonth}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

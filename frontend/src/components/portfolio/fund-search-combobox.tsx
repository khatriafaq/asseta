"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2, Check, Plus } from "lucide-react";
import { useFundSearch } from "@/lib/hooks/use-funds";
import { createFund } from "@/lib/api/funds";
import type { FundBrief } from "@/lib/types";

const FUND_TYPES = [
  "Equity Fund",
  "Money Market Fund",
  "Income Fund",
  "Asset Allocation Fund",
  "Balanced Fund",
  "Fund of Funds",
  "Capital Protected Fund",
  "Shariah Compliant",
] as const;

interface FundSearchComboboxProps {
  value: FundBrief | null;
  onChange: (fund: FundBrief) => void;
  disabled?: boolean;
}

export function FundSearchCombobox({
  value,
  onChange,
  disabled = false,
}: FundSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newFundType, setNewFundType] = useState<string>(FUND_TYPES[0]);
  const [isShariah, setIsShariah] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: funds, isLoading } = useFundSearch(query);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightIdx(0);
  }, [funds]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !funds?.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, funds.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectFund(funds[highlightIdx]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setShowCreateForm(false);
    }
  };

  const selectFund = (fund: FundBrief) => {
    onChange(fund);
    setQuery("");
    setIsOpen(false);
    setShowCreateForm(false);
  };

  const handleCreateFund = async () => {
    if (!query.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const fund = await createFund({
        name: query.trim(),
        scheme_key: `CUSTOM | ${query.trim()}`,
        fund_type: newFundType,
        is_shariah_compliant: isShariah,
      });
      selectFund(fund);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : "Failed to create fund";
      setCreateError(msg ?? "Failed to create fund");
    } finally {
      setCreating(false);
    }
  };

  const typeColors: Record<string, string> = {
    Equity: "var(--jade)",
    "Money Market": "var(--sky)",
    Income: "var(--amber)",
    "Asset Allocation": "var(--coral)",
  };

  return (
    <div ref={containerRef} className="relative">
      {value && !isOpen ? (
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            }
          }}
          disabled={disabled}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors disabled:opacity-50"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{value.name}</p>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {value.fund_type}
              {value.is_shariah_compliant && " · Shariah"}
            </p>
          </div>
          {!disabled && (
            <span className="text-[11px] text-[var(--text-muted)]">Change</span>
          )}
        </button>
      ) : (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{
            background: "var(--bg-elevated)",
            border: `1px solid ${isOpen ? "var(--border-jade)" : "var(--border-subtle)"}`,
          }}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-[var(--text-muted)] animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setShowCreateForm(false);
            }}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search or type fund name..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
          />
        </div>
      )}

      {/* Dropdown — search results */}
      {isOpen && !showCreateForm && funds && funds.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-xl py-1"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          {funds.map((fund, idx) => (
            <button
              key={fund.id}
              type="button"
              onClick={() => selectFund(fund)}
              onMouseEnter={() => setHighlightIdx(idx)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors"
              style={{
                background: idx === highlightIdx ? "var(--bg-hover)" : "transparent",
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{fund.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      color: typeColors[fund.fund_type] ?? "var(--text-secondary)",
                      background: `${typeColors[fund.fund_type] ?? "var(--text-secondary)"}15`,
                    }}
                  >
                    {fund.fund_type}
                  </span>
                  {fund.current_nav !== null && (
                    <span className="text-[11px] text-[var(--text-muted)] font-mono-nums">
                      NAV {Number(fund.current_nav).toFixed(2)}
                    </span>
                  )}
                  {fund.is_shariah_compliant && (
                    <span className="text-[10px] font-semibold text-[var(--jade)] px-1.5 py-0.5 rounded" style={{ background: "var(--jade-soft)" }}>
                      Shariah
                    </span>
                  )}
                </div>
              </div>
              {value?.id === fund.id && (
                <Check className="w-4 h-4 text-[var(--jade)]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Dropdown — no results, offer to create */}
      {isOpen && !showCreateForm && query.length >= 2 && !isLoading && funds?.length === 0 && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          <div className="px-3 py-3 text-center">
            <p className="text-sm text-[var(--text-muted)]">No funds found</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[var(--jade)] hover:bg-[var(--bg-hover)] transition-colors"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <Plus className="w-4 h-4" />
            Create &quot;{query.trim()}&quot;
          </button>
        </div>
      )}

      {/* Inline create form */}
      {isOpen && showCreateForm && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl p-3 space-y-3"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-jade)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            Create new fund
          </p>
          <div
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            {query.trim()}
          </div>
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">Fund Type</label>
            <select
              value={newFundType}
              onChange={(e) => setNewFundType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              {FUND_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isShariah}
              onChange={(e) => setIsShariah(e.target.checked)}
              className="rounded accent-[var(--jade)]"
            />
            <span className="text-[var(--text-secondary)]">Shariah compliant</span>
          </label>
          {createError && (
            <p className="text-xs text-[var(--coral)]">{createError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="flex-1 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateFund}
              disabled={creating}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ background: "var(--jade)", color: "var(--bg-deep)" }}
            >
              {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

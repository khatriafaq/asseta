"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useImportExcel } from "@/lib/hooks/use-transactions";
import type { ImportSummary } from "@/lib/types";
import { createPortal } from "react-dom";

interface ExcelImportDialogProps {
  open: boolean;
  onClose: () => void;
  portfolioId: number;
}

type Stage = "idle" | "selected" | "uploading" | "success" | "error";

export function ExcelImportDialog({
  open,
  onClose,
  portfolioId,
}: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportExcel(portfolioId);

  const reset = () => {
    setFile(null);
    setStage("idle");
    setSummary(null);
    setErrorMsg("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setStage("selected");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".xlsx")) {
      setFile(f);
      setStage("selected");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStage("uploading");
    try {
      const result = await importMutation.mutateAsync(file);
      setSummary(result);
      setStage("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Import failed");
      setStage("error");
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />
      <div
        className="relative w-full max-w-md mx-4 p-6 rounded-2xl animate-fade-in-up"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Import from Excel
          </h3>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Drop zone / Selected / Uploading / Result */}
        {stage === "idle" && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl cursor-pointer transition-colors hover:bg-[var(--bg-elevated)]"
            style={{ border: "2px dashed var(--border-light)" }}
          >
            <Upload className="w-8 h-8 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)]">
              Drop your <span className="font-mono-nums text-[var(--jade)]">.xlsx</span> file here or click to browse
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {stage === "selected" && file && (
          <div className="space-y-4">
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              <FileSpreadsheet className="w-8 h-8 text-[var(--jade)]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button onClick={reset} className="p-1 hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
                <X className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
            </div>
            <button
              onClick={handleUpload}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: "var(--jade)", color: "var(--bg-deep)" }}
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
          </div>
        )}

        {stage === "uploading" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 text-[var(--jade)] animate-spin" />
            <p className="text-sm text-[var(--text-secondary)]">Importing data...</p>
          </div>
        )}

        {stage === "success" && summary && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle className="w-10 h-10 text-[var(--jade)]" />
              <p className="text-sm font-medium">Import complete</p>
            </div>
            <div
              className="space-y-2 p-3 rounded-xl text-sm"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              {[
                ["Transactions", summary.transactions],
                ["Funds", summary.funds],
                ["Institutions", summary.institutions],
                ["Categories", summary.categories],
                ["Target Allocations", summary.target_allocations],
              ]
                .filter(([, count]) => (count as number) > 0)
                .map(([label, count]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-[var(--text-muted)]">{label}</span>
                    <span className="font-mono-nums font-medium">{count as number}</span>
                  </div>
                ))}
            </div>
            <button
              onClick={handleClose}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: "var(--jade)", color: "var(--bg-deep)" }}
            >
              Done
            </button>
          </div>
        )}

        {stage === "error" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 py-4">
              <AlertCircle className="w-10 h-10 text-[var(--coral)]" />
              <p className="text-sm font-medium text-[var(--coral)]">Import failed</p>
              <p className="text-xs text-[var(--text-muted)] text-center">{errorMsg}</p>
            </div>
            <button
              onClick={reset}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

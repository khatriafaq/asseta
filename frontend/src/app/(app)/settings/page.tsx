"use client";

import { useState, useEffect } from "react";
import { Save, Eye, EyeOff, ExternalLink, Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import { updateMe } from "@/lib/api/auth";
import { useFIProfile, useUpsertFIProfile } from "@/lib/hooks/use-fi";
import { formatPKR } from "@/lib/utils";
import type { RiskTolerance, UserProfileUpdate } from "@/lib/types";

const RISK_OPTIONS: { value: RiskTolerance; label: string; description: string }[] = [
  { value: "conservative", label: "Conservative", description: "Capital preservation, lower returns" },
  { value: "moderate", label: "Moderate", description: "Balanced growth and stability" },
  { value: "aggressive", label: "Aggressive", description: "Maximum growth, higher volatility" },
];

const FI_STRATEGIES = [
  { value: "lean", label: "Lean FI", description: "Minimal lifestyle, lower target" },
  { value: "moderate", label: "Moderate FI", description: "Comfortable lifestyle" },
  { value: "fat", label: "Fat FI", description: "Abundant lifestyle, higher target" },
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // FI Profile
  const { data: fiProfile } = useFIProfile();
  const upsertFI = useUpsertFIProfile();
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [swr, setSwr] = useState("3.33");
  const [expectedReturn, setExpectedReturn] = useState("15");
  const [inflation, setInflation] = useState("12");
  const [fiStrategy, setFiStrategy] = useState("moderate");
  const [baristaIncome, setBaristaIncome] = useState("");

  useEffect(() => {
    if (fiProfile) {
      setMonthlyExpenses(fiProfile.monthly_expenses.toString());
      setSwr((fiProfile.safe_withdrawal_rate * 100).toFixed(1));
      setExpectedReturn((fiProfile.expected_return_rate * 100).toFixed(1));
      setInflation((fiProfile.inflation_rate * 100).toFixed(1));
      setFiStrategy(fiProfile.fi_strategy);
      setBaristaIncome(fiProfile.barista_monthly_income?.toString() ?? "");
    }
  }, [fiProfile]);

  const fiNumber = monthlyExpenses
    ? (parseFloat(monthlyExpenses) * 12) / (parseFloat(swr) / 100)
    : null;

  const [name, setName] = useState(user?.name ?? "");
  const [dob, setDob] = useState(user?.date_of_birth ?? "");
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance | "">(
    user?.risk_tolerance ?? ""
  );
  const [horizon, setHorizon] = useState(user?.investment_horizon_years ?? 10);
  const [monthlyIncome, setMonthlyIncome] = useState(
    user?.monthly_income?.toString() ?? ""
  );
  const [geminiKey, setGeminiKey] = useState("");

  const handleSaveFI = () => {
    const parsed = parseFloat(monthlyExpenses);
    if (!parsed || parsed <= 0) {
      toast.error("Enter a valid monthly expenses amount");
      return;
    }
    upsertFI.mutate({
      monthly_expenses: parsed,
      safe_withdrawal_rate: parseFloat(swr) / 100,
      expected_return_rate: parseFloat(expectedReturn) / 100,
      inflation_rate: parseFloat(inflation) / 100,
      fi_strategy: fiStrategy,
      barista_monthly_income: baristaIncome ? parseFloat(baristaIncome) : null,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UserProfileUpdate = {};
      if (name !== (user?.name ?? "")) payload.name = name;
      if (dob) payload.date_of_birth = dob;
      if (riskTolerance) payload.risk_tolerance = riskTolerance;
      if (horizon !== user?.investment_horizon_years) payload.investment_horizon_years = horizon;
      if (monthlyIncome) payload.monthly_income = parseFloat(monthlyIncome);
      if (geminiKey) payload.gemini_api_key = geminiKey;

      const updated = await updateMe(payload);
      useAuthStore.setState({ user: updated });
      setGeminiKey("");
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="animate-fade-in-up">
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Settings
        </h2>
        <p className="text-[var(--text-muted)] text-sm mt-1">
          Manage your profile and AI configuration
        </p>
      </div>

      {/* Profile Section */}
      <div className="glass-card p-6 space-y-5 animate-fade-in-up stagger-1">
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          Profile
        </h3>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm focus:border-[var(--jade)] focus:ring-1 focus:ring-[var(--jade)] outline-none transition-all"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm focus:border-[var(--jade)] focus:ring-1 focus:ring-[var(--jade)] outline-none transition-all"
            />
          </div>

          {/* Risk Tolerance */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Risk Tolerance</label>
            <div className="grid grid-cols-3 gap-2">
              {RISK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRiskTolerance(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    riskTolerance === opt.value
                      ? "border-[var(--jade)] bg-[var(--jade-soft)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <p className={`text-sm font-medium ${riskTolerance === opt.value ? "text-[var(--jade)]" : ""}`}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Investment Horizon */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">
              Investment Horizon: <span className="font-mono-nums font-medium text-[var(--text-primary)]">{horizon} years</span>
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={horizon}
              onChange={(e) => setHorizon(parseInt(e.target.value))}
              className="w-full accent-[var(--jade)]"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
              <span>1 year</span>
              <span>30 years</span>
            </div>
          </div>

          {/* Monthly Income */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Monthly Income (PKR)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">PKR</span>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="e.g. 150000"
                className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm font-mono-nums focus:border-[var(--jade)] focus:ring-1 focus:ring-[var(--jade)] outline-none transition-all placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FI Profile */}
      <div className="glass-card p-6 space-y-5 animate-fade-in-up stagger-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
            FI Profile
          </h3>
          {fiNumber && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--jade-soft)] text-[var(--jade)] text-xs font-medium">
              <Target className="w-3 h-3" />
              FI Number: {formatPKR(fiNumber)}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Monthly Expenses */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">
              Monthly Expenses (PKR)
              <span className="ml-1 text-[var(--coral)]">*</span>
            </label>
            <p className="text-[11px] text-[var(--text-muted)] mb-2">
              Your target monthly spend used to calculate your FI Number (annual expenses ÷ SWR)
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">PKR</span>
              <input
                type="number"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(e.target.value)}
                placeholder="e.g. 150000"
                className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm font-mono-nums focus:border-[var(--jade)] focus:ring-1 focus:ring-[var(--jade)] outline-none transition-all placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          {/* Rates row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">SWR (%)</label>
              <input
                type="number"
                value={swr}
                onChange={(e) => setSwr(e.target.value)}
                step="0.1"
                min="1"
                max="10"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm font-mono-nums focus:border-[var(--jade)] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">Expected Return (%)</label>
              <input
                type="number"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                step="0.5"
                min="1"
                max="50"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm font-mono-nums focus:border-[var(--jade)] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">Inflation (%)</label>
              <input
                type="number"
                value={inflation}
                onChange={(e) => setInflation(e.target.value)}
                step="0.5"
                min="1"
                max="50"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm font-mono-nums focus:border-[var(--jade)] outline-none transition-all"
              />
            </div>
          </div>

          {/* FI Strategy */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-2">FI Strategy</label>
            <div className="grid grid-cols-3 gap-2">
              {FI_STRATEGIES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFiStrategy(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    fiStrategy === opt.value
                      ? "border-[var(--jade)] bg-[var(--jade-soft)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  <p className={`text-sm font-medium ${fiStrategy === opt.value ? "text-[var(--jade)]" : ""}`}>
                    {opt.label}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

          {/* Barista FI Monthly Income */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">
              Barista FI — Part-time Income (PKR/month) <span className="text-[var(--text-muted)] font-normal">(optional)</span>
            </label>
            <p className="text-[11px] text-[var(--text-muted)] mb-2">
              If you plan to semi-retire with part-time work, enter that income. Your Barista FI Number will be reduced accordingly.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">PKR</span>
              <input
                type="number"
                value={baristaIncome}
                onChange={(e) => setBaristaIncome(e.target.value)}
                placeholder="e.g. 80000"
                className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm font-mono-nums focus:border-[var(--jade)] focus:ring-1 focus:ring-[var(--jade)] outline-none transition-all placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

        <button
          onClick={handleSaveFI}
          disabled={upsertFI.isPending || !monthlyExpenses}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--jade)] text-[var(--bg-deep)] text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {upsertFI.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
          Save FI Profile
        </button>
      </div>

      {/* AI Configuration */}
      <div className="glass-card p-6 space-y-5 animate-fade-in-up stagger-2">
        <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
          AI Configuration
        </h3>

        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1.5">
            Google Gemini API Key
          </label>
          {user?.gemini_api_key_masked && (
            <p className="text-xs text-[var(--text-secondary)] mb-2">
              Current key: <span className="font-mono-nums">{user.gemini_api_key_masked}</span>
            </p>
          )}
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder={user?.gemini_api_key_masked ? "Enter new key to replace" : "Paste your API key"}
              className="w-full px-4 pr-10 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm font-mono-nums focus:border-[var(--jade)] focus:ring-1 focus:ring-[var(--jade)] outline-none transition-all placeholder:text-[var(--text-muted)]"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-[var(--sky)] mt-2 hover:underline"
          >
            Get a free API key from Google AI Studio
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--jade)] text-[var(--bg-deep)] text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Save Settings
      </button>
    </div>
  );
}

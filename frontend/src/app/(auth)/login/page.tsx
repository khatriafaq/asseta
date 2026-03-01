"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, TrendingUp, ArrowRight, Lock, Mail, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#030912] via-[#0A1628] to-[#0D2137]">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[var(--jade)] rounded-full opacity-[0.04] blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[var(--sky)] rounded-full opacity-[0.03] blur-[120px] animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-[var(--amber)] rounded-full opacity-[0.03] blur-[80px] animate-float" style={{ animationDelay: "3s" }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(var(--jade) 1px, transparent 1px), linear-gradient(90deg, var(--jade) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--jade)] to-[var(--jade-dim)] flex items-center justify-center shadow-xl shadow-[var(--jade-glow)]">
              <TrendingUp className="w-6 h-6 text-[var(--bg-deep)]" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                Asseta
              </h1>
              <p className="text-[11px] text-[var(--text-muted)] tracking-widest uppercase">
                Portfolio Manager
              </p>
            </div>
          </div>

          {/* Value Props */}
          <div className="space-y-8 max-w-sm animate-fade-in-up stagger-2">
            <h2 className="text-4xl font-bold leading-tight tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Your path to{" "}
              <span className="bg-gradient-to-r from-[var(--jade)] to-[var(--sky)] bg-clip-text text-transparent">
                financial independence
              </span>
            </h2>
            <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
              Track Shariah-compliant mutual funds, optimize your allocation, and build lasting wealth.
            </p>
            <div className="space-y-4">
              {[
                "Real-time NAV tracking from MUFAP",
                "Smart rebalancing suggestions",
                "50/30/20 budget monitoring",
                "FI progress & projections",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--jade)]" />
                  <span className="text-sm text-[var(--text-secondary)]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-[var(--text-muted)] animate-fade-in-up stagger-4">
            Shariah-compliant &middot; Pakistan-focused &middot; Open source
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--bg-deep)]">
        <div className="w-full max-w-sm space-y-8 animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--jade)] to-[var(--jade-dim)] flex items-center justify-center shadow-lg shadow-[var(--jade-glow)]">
              <TrendingUp className="w-5 h-5 text-[var(--bg-deep)]" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Asseta</h1>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Welcome back
            </h2>
            <p className="text-[var(--text-muted)] text-sm mt-2">
              Sign in to your portfolio
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-[var(--coral)]/10 border border-[var(--coral)]/20 text-sm text-[var(--coral)]">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm focus:border-[var(--jade)] focus:ring-1 focus:ring-[var(--jade)]/30 outline-none transition-all placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Password
                </label>
                <button type="button" className="text-xs text-[var(--jade)] hover:text-[var(--jade)]/80 font-medium">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm focus:border-[var(--jade)] focus:ring-1 focus:ring-[var(--jade)]/30 outline-none transition-all placeholder:text-[var(--text-muted)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[var(--jade)] to-[var(--jade-dim)] text-[var(--bg-deep)] text-sm font-semibold hover:shadow-lg hover:shadow-[var(--jade-glow)] transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-muted)]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[var(--jade)] font-medium hover:text-[var(--jade)]/80">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

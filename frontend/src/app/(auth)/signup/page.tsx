"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, TrendingUp, ArrowRight, Lock, Mail, User, CheckCircle2, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function SignupPage() {
  const router = useRouter();
  const signupAction = useAuthStore((s) => s.signup);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Passwords match", ok: password.length > 0 && password === confirm },
  ];

  const allValid = passwordChecks.every((c) => c.ok) && name.length > 0 && email.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) return;
    setError("");
    setLoading(true);
    try {
      await signupAction(name, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Signup failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-deep)] relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--jade)] rounded-full opacity-[0.02] blur-[200px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--sky)] rounded-full opacity-[0.02] blur-[150px]" />

      <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--jade)] to-[var(--jade-dim)] flex items-center justify-center shadow-xl shadow-[var(--jade-glow)]">
            <TrendingUp className="w-7 h-7 text-[var(--bg-deep)]" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Create your account
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              Start tracking your Shariah-compliant investments
            </p>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-[var(--coral)]/10 border border-[var(--coral)]/20 text-sm text-[var(--coral)]">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm focus:border-[var(--jade)] focus:ring-1 focus:ring-[var(--jade)]/30 outline-none transition-all placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
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
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
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

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm your password"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm focus:border-[var(--jade)] focus:ring-1 focus:ring-[var(--jade)]/30 outline-none transition-all placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          {/* Password Strength */}
          {password.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {passwordChecks.map((check) => (
                <div
                  key={check.label}
                  className="flex items-center gap-1.5 text-[11px]"
                  style={{ color: check.ok ? "var(--jade)" : "var(--text-muted)" }}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {check.label}
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !allValid}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[var(--jade)] to-[var(--jade-dim)] text-[var(--bg-deep)] text-sm font-semibold hover:shadow-lg hover:shadow-[var(--jade-glow)] transition-all duration-300 active:scale-[0.98] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--jade)] font-medium hover:text-[var(--jade)]/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

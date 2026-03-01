"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  PieChart,
  Wallet,
  Shield,
  Camera,
  Settings,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/allocation", label: "Allocation", icon: PieChart },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/emergency-fund", label: "Safety Net", icon: Shield },
  { href: "/snapshots", label: "Snapshots", icon: Camera },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-screen fixed left-0 top-0 z-40 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[var(--border-subtle)]">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--jade)] to-[var(--jade-dim)] flex items-center justify-center shadow-lg shadow-[var(--jade-glow)]">
          <TrendingUp className="w-5 h-5 text-[var(--bg-deep)]" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Asseta
          </h1>
          <p className="text-[11px] text-[var(--text-muted)] tracking-wider uppercase">
            Portfolio Manager
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[var(--jade-soft)] text-[var(--jade)] border border-[var(--border-jade)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              )}
            >
              <item.icon className={cn("w-[18px] h-[18px]", isActive && "drop-shadow-[0_0_6px_var(--jade)]")} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--jade)] shadow-[0_0_8px_var(--jade)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--jade-dim)] to-[var(--sky)] flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name ?? "User"}</p>
            <p className="text-[11px] text-[var(--text-muted)]">Free Plan</p>
          </div>
          <button onClick={handleLogout} title="Log out">
            <LogOut className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--coral)]" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-xl safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all",
                isActive
                  ? "text-[var(--jade)]"
                  : "text-[var(--text-muted)]"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_var(--jade)]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 rounded-full bg-[var(--jade)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

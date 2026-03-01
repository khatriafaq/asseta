"use client";

import { Sidebar, BottomNav } from "@/components/sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { usePortfolios } from "@/lib/hooks/use-portfolios";

function PortfolioLoader({ children }: { children: React.ReactNode }) {
  // Load portfolios on app mount so activePortfolioId is set
  usePortfolios();
  return <>{children}</>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PortfolioLoader>
        <div className="relative min-h-screen">
          <Sidebar />
          <BottomNav />
          <main className="md:ml-[260px] pb-24 md:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
              {children}
            </div>
          </main>
        </div>
      </PortfolioLoader>
    </AuthGuard>
  );
}

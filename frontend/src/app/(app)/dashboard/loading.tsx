import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* KPI Row — 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5">
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-7 w-28 mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
        <div className="glass-card p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      </div>

      {/* Recent transactions */}
      <div className="glass-card p-6">
        <Skeleton className="h-4 w-40 mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-36 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

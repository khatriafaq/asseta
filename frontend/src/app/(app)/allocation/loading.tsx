import { Skeleton } from "@/components/ui/skeleton";

export default function AllocationLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Bar chart */}
      <div className="glass-card p-6">
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="flex items-end gap-6 h-52">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 flex gap-2 items-end">
              <Skeleton className="flex-1 rounded-t-md" style={{ height: `${40 + Math.random() * 50}%` }} />
              <Skeleton className="flex-1 rounded-t-md" style={{ height: `${30 + Math.random() * 60}%` }} />
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 h-3 rounded" />
          ))}
        </div>
      </div>

      {/* Drift status + Target editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <Skeleton className="h-4 w-28 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-2 h-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="w-4 h-4 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-2.5 h-2.5 rounded-sm" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Rebalance */}
      <div className="glass-card p-6">
        <Skeleton className="h-5 w-36 mb-2" />
        <Skeleton className="h-3 w-56 mb-4" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

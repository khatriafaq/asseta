import { Skeleton } from "@/components/ui/skeleton";

export default function SnapshotsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-36 mb-2" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      {/* Growth chart */}
      <div className="glass-card p-6">
        <Skeleton className="h-4 w-36 mb-4" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>

      {/* FI metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5">
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>

      {/* Snapshot table */}
      <div className="glass-card p-6">
        <Skeleton className="h-4 w-36 mb-5" />
        {/* Table header */}
        <div className="flex items-center gap-4 pb-3 border-b border-[var(--border-subtle)]">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20 ml-auto" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
        {/* Rows */}
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3.5 border-b border-[var(--border-subtle)]">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20 ml-auto" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

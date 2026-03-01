import { Skeleton } from "@/components/ui/skeleton";

export default function PortfolioLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-36 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>

      {/* Tabs + View toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Skeleton className="h-10 w-52 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-44 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>

      {/* Holdings table */}
      <div className="glass-card-static p-5">
        {/* Table header */}
        <div className="flex items-center gap-4 pb-3 border-b border-[var(--border-subtle)]">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16 ml-auto hidden lg:block" />
          <Skeleton className="h-3 w-16 hidden lg:block" />
          <Skeleton className="h-3 w-12 hidden md:block" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16 hidden sm:block" />
        </div>
        {/* Table rows */}
        <div className="space-y-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3.5 border-b border-[var(--border-subtle)]">
              <div className="flex-1">
                <Skeleton className="h-4 w-44 mb-1" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-4 w-14 hidden lg:block" />
              <Skeleton className="h-4 w-14 hidden lg:block" />
              <Skeleton className="h-4 w-14 hidden md:block" />
              <Skeleton className="h-4 w-20" />
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-12 ml-auto" />
              </div>
              <Skeleton className="h-1.5 w-16 rounded-full hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

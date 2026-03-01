import { Skeleton } from "@/components/ui/skeleton";

export default function BudgetLoading() {
  return (
    <div className="space-y-6">
      {/* Header + Month selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>

      {/* Budget bar overview */}
      <div className="glass-card p-6">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-8 w-full rounded-full mb-3" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Income section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Expense buckets — Needs & Wants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, b) => (
          <div key={b} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Savings rate card */}
      <div className="glass-card p-6">
        <Skeleton className="h-4 w-28 mb-4" />
        <div className="flex items-center gap-6">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

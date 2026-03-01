import { Skeleton } from "@/components/ui/skeleton";

export default function EmergencyFundLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-36 mb-2" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Progress ring */}
      <div className="glass-card p-8 flex flex-col items-center">
        <Skeleton className="w-40 h-40 rounded-full mb-6" />
        {/* Milestone track */}
        <div className="flex items-center gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Key metrics — 2x2 grid */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5">
            <Skeleton className="h-3 w-24 mb-3" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>

      {/* Tagged accounts */}
      <div className="glass-card p-6">
        <Skeleton className="h-4 w-32 mb-5" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-5 h-5 rounded" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="h-10 w-32 rounded-xl mt-4" />
      </div>
    </div>
  );
}

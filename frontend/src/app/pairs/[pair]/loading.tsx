import { Skeleton } from "@/components/Skeleton";

export default function LoadingPair() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      {/* Back link */}
      <Skeleton className="h-4 w-20" />

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-48 rounded-xl glass-panel" />
      </div>
      
      {/* Arena Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full glass-panel" />
        ))}
      </div>

      {/* Price Chart Panel skeleton */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-14" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>

      {/* Volatility Arena Panel skeleton */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-56" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
      
      {/* Table skeleton */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5">
        <Skeleton className="h-4 w-36 mb-4" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

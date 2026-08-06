import { Skeleton } from "@/components/Skeleton";

export default function LoadingPair() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-10 w-64 rounded-xl glass-panel" />
      </div>
      
      {/* Arena Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full glass-panel" />
        ))}
      </div>

      {/* Chart */}
      <Skeleton className="h-96 w-full rounded-xl glass-panel" />
      
      {/* Table */}
      <Skeleton className="h-64 w-full mt-6 rounded-2xl glass-panel" />
    </div>
  );
}

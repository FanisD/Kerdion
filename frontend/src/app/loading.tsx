import { Skeleton } from "@/components/Skeleton";

export default function LoadingOverview() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10">
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
      
      {/* LiveFeedPanel Skeleton */}
      <Skeleton className="h-32 w-full glass-panel" />

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full glass-panel" />
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/Skeleton";

export default function LoadingTopology() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <Skeleton className="h-10 w-64 mb-2" />
      <Skeleton className="h-5 w-96 mb-8" />
      
      <div className="flex flex-col items-start gap-6">
        <Skeleton className="h-[450px] w-[450px] rounded-lg glass-panel" />
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-zinc-800/40 backdrop-blur-md ${className}`} />
  );
}

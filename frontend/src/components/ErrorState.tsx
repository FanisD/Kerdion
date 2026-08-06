const STYLES = {
  container: "flex flex-col items-center justify-center gap-4 rounded-2xl glass-panel p-12 text-center min-h-[300px] border border-[var(--border-strong)] shadow-[0_0_30px_rgba(0,229,255,0.05)]",
  icon: "mb-2 text-[var(--text-secondary)] opacity-80 animate-pulse",
  message: "text-xl font-bold tracking-wide text-[var(--text-primary)] max-w-md",
  hint: "text-sm text-[var(--text-secondary)]",
};

export function ErrorState({ message }: { message: string }) {
  const isPipelineEmpty = message.toLowerCase().includes("not found") || message.toLowerCase().includes("no data") || message.toLowerCase().includes("500");
  const displayHint = isPipelineEmpty ? "Awaiting first pipeline run..." : "Try refreshing the page in a moment.";

  return (
    <div className={STYLES.container}>
      <svg className={STYLES.icon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className={STYLES.message}>{message}</p>
      <p className={STYLES.hint}>{displayHint}</p>
    </div>
  );
}

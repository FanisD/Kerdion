const STYLES = {
  container: "flex flex-col items-center justify-center gap-4 rounded-2xl glass-panel p-12 text-center min-h-[300px]",
  message: "text-lg font-medium text-[var(--text-primary)] max-w-md",
  hint: "text-sm text-[var(--text-secondary)]",
};

export function ErrorState({ message }: { message: string }) {
  return (
    <div className={STYLES.container}>
      <p className={STYLES.message}>{message}</p>
      <p className={STYLES.hint}>Try refreshing the page in a moment.</p>
    </div>
  );
}

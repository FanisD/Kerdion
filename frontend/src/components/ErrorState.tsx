const STYLES = {
  container: "flex flex-col items-center gap-2 rounded-2xl border border-black/10 bg-white p-8 text-center dark:border-white/10 dark:bg-zinc-950",
  message: "text-sm text-zinc-600 dark:text-zinc-400",
  hint: "text-xs text-zinc-500 dark:text-zinc-500",
};

export function ErrorState({ message }: { message: string }) {
  return (
    <div className={STYLES.container}>
      <p className={STYLES.message}>{message}</p>
      <p className={STYLES.hint}>Try refreshing the page in a moment.</p>
    </div>
  );
}

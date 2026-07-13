"use client";

import { useActionState } from "react";
import { login } from "./actions";

const STYLES = {
  container: "flex flex-1 items-center justify-center px-6 py-10",
  card: "flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950",
  heading: "text-lg font-semibold tracking-tight text-black dark:text-zinc-50",
  field: "flex flex-col gap-1",
  label: "text-xs font-medium text-zinc-600 dark:text-zinc-400",
  input: "rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black/30 dark:border-white/10 dark:text-zinc-50 dark:focus:border-white/30",
  error: "text-sm text-red-600 dark:text-red-400",
  submit: "mt-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200",
};

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(login, null);

  return (
    <div className={STYLES.container}>
      <form action={formAction} className={STYLES.card}>
        <h1 className={STYLES.heading}>Sign in to Kerdion</h1>

        <div className={STYLES.field}>
          <label htmlFor="username" className={STYLES.label}>
            Username
          </label>
          <input id="username" name="username" type="text" required className={STYLES.input} />
        </div>

        <div className={STYLES.field}>
          <label htmlFor="password" className={STYLES.label}>
            Password
          </label>
          <input id="password" name="password" type="password" required className={STYLES.input} />
        </div>

        {error && <p className={STYLES.error}>{error}</p>}

        <button type="submit" disabled={isPending} className={STYLES.submit}>
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

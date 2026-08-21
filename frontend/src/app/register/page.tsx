"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerRequest } from "@/lib/authClient";

const STYLES = {
  container: "flex flex-1 items-center justify-center px-6 py-10",
  card: "flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950",
  heading: "text-lg font-semibold tracking-tight text-black dark:text-zinc-50",
  field: "flex flex-col gap-1",
  label: "text-xs font-medium text-zinc-600 dark:text-zinc-400",
  input: "rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black/30 dark:border-white/10 dark:text-zinc-50 dark:focus:border-white/30",
  error: "text-sm text-red-600 dark:text-red-400",
  submit: "mt-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200",
  footer: "text-sm text-zinc-600 dark:text-zinc-400",
  footerLink: "font-medium text-black hover:underline dark:text-zinc-50",
  row: "flex gap-3",
};

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsPending(true);

    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const first_name = String(formData.get("first_name"));
    const last_name = String(formData.get("last_name"));
    const occupation = formData.get("occupation")
      ? String(formData.get("occupation"))
      : undefined;

    const result = await registerRequest({
      email,
      password,
      first_name,
      last_name,
      occupation,
    });

    setIsPending(false);
    if (result) {
      setError(result.error);
      return;
    }
    router.push("/verify-pending");
  }

  return (
    <div className={STYLES.container}>
      <form action={handleSubmit} className={STYLES.card}>
        <h1 className={STYLES.heading}>Create your Kerdion account</h1>

        <div className={STYLES.row}>
          <div className={`${STYLES.field} flex-1`}>
            <label htmlFor="first_name" className={STYLES.label}>
              First Name
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              required
              className={STYLES.input}
            />
          </div>

          <div className={`${STYLES.field} flex-1`}>
            <label htmlFor="last_name" className={STYLES.label}>
              Last Name
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              required
              className={STYLES.input}
            />
          </div>
        </div>

        <div className={STYLES.field}>
          <label htmlFor="occupation" className={STYLES.label}>
            Occupation <span className="text-zinc-500">(optional)</span>
          </label>
          <input
            id="occupation"
            name="occupation"
            type="text"
            className={STYLES.input}
          />
        </div>

        <div className={STYLES.field}>
          <label htmlFor="email" className={STYLES.label}>
            Email
          </label>
          <input id="email" name="email" type="email" required className={STYLES.input} />
        </div>

        <div className={STYLES.field}>
          <label htmlFor="password" className={STYLES.label}>
            Password
          </label>
          <input id="password" name="password" type="password" required className={STYLES.input} />
        </div>

        {error && <p className={STYLES.error}>{error}</p>}

        <button type="submit" disabled={isPending} className={STYLES.submit}>
          {isPending ? "Creating account..." : "Create account"}
        </button>

        <p className={STYLES.footer}>
          Already have an account?{" "}
          <Link href="/login" className={STYLES.footerLink}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

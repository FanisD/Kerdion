"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const STYLES = {
  container: "flex flex-1 items-center justify-center px-6 py-10",
  card: "flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-white/10 bg-zinc-950 p-8 text-center",
  iconSuccess:
    "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-3xl",
  iconError:
    "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 text-3xl",
  iconLoading:
    "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-3xl animate-pulse",
  heading: "text-lg font-semibold tracking-tight text-zinc-50",
  body: "text-sm leading-relaxed text-zinc-400",
  link: "rounded-lg bg-zinc-50 px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200",
};

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (res.ok) {
          setStatus("success");
          setMessage(data?.message ?? "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data?.error ?? "Verification failed. The link may be invalid or expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Could not reach the verification service.");
      });
  }, [token]);

  return (
    <div className={STYLES.container}>
      <div className={STYLES.card}>
        {status === "loading" && (
          <>
            <div className={STYLES.iconLoading}>⏳</div>
            <h1 className={STYLES.heading}>Verifying your email…</h1>
            <p className={STYLES.body}>Please wait while we confirm your address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className={STYLES.iconSuccess}>✓</div>
            <h1 className={STYLES.heading}>Email Verified!</h1>
            <p className={STYLES.body}>{message}</p>
            <Link href="/login" className={STYLES.link}>
              Proceed to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className={STYLES.iconError}>✕</div>
            <h1 className={STYLES.heading}>Verification Failed</h1>
            <p className={STYLES.body}>{message}</p>
            <Link href="/register" className={STYLES.link}>
              Try Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

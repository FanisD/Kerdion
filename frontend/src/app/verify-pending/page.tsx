import Link from "next/link";

const STYLES = {
  container: "flex flex-1 items-center justify-center px-6 py-10",
  card: "flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-white/10 bg-zinc-950 p-8 text-center",
  icon: "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-3xl",
  heading: "text-lg font-semibold tracking-tight text-zinc-50",
  body: "text-sm leading-relaxed text-zinc-400",
  link: "rounded-lg bg-zinc-50 px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200",
};

export default function VerifyPendingPage() {
  return (
    <div className={STYLES.container}>
      <div className={STYLES.card}>
        <div className={STYLES.icon}>✉️</div>
        <h1 className={STYLES.heading}>Check your email</h1>
        <p className={STYLES.body}>
          We&apos;ve sent a verification link to your email address. Please
          click the link to verify your account before signing in.
        </p>
        <p className={STYLES.body}>
          Didn&apos;t receive the email? Check your spam folder or try
          registering again.
        </p>
        <Link href="/login" className={STYLES.link}>
          Go to Sign In
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { LogoutButton } from "@/components/LogoutButton";
import { getServerToken } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kerdion Dashboard",
  description: "Real-time crypto volatility prediction dashboard",
};

const STYLES = {
  html: "h-full antialiased dark",
  body: "min-h-full flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] selection:bg-[var(--accent-primary)] selection:text-white",
  nav: "sticky top-0 z-50 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 px-6 py-4 backdrop-blur-md",
  navBrand: "text-sm font-bold tracking-widest text-[var(--accent-primary)] uppercase",
  navLinks: "flex items-center gap-6 text-sm font-medium text-[var(--text-secondary)]",
  navLink: "transition-colors hover:text-[var(--text-primary)]",
  main: "flex flex-1 flex-col",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuthenticated = Boolean(await getServerToken());

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${STYLES.html}`}
    >
      <body className={STYLES.body}>
        <nav className={STYLES.nav}>
          <Link href="/" className={STYLES.navBrand}>
            Kerdion
          </Link>
          <div className={STYLES.navLinks}>
            <Link href="/" className={STYLES.navLink}>
              Overview
            </Link>
            <Link href="/topology" className={STYLES.navLink}>
              Topology
            </Link>
            <ConnectionStatusBadge trackLiveStatus={isAuthenticated} />
            {isAuthenticated && <LogoutButton />}
          </div>
        </nav>
        <main className={STYLES.main}>{children}</main>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { LogoutButton } from "@/components/LogoutButton";
import { getServerToken } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kerdion Dashboard",
  description: "Real-time crypto volatility prediction dashboard",
};

const STYLES = {
  html: "h-full antialiased",
  body: "min-h-full flex flex-col bg-zinc-50 dark:bg-black",
  nav: "flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10",
  navBrand: "text-sm font-semibold tracking-tight text-black dark:text-zinc-50",
  navLinks: "flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400",
  navLink: "transition-colors hover:text-black dark:hover:text-zinc-50",
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
      className={`${geistSans.variable} ${geistMono.variable} ${STYLES.html}`}
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
            <ConnectionStatusBadge />
            {isAuthenticated && <LogoutButton />}
          </div>
        </nav>
        <main className={STYLES.main}>{children}</main>
      </body>
    </html>
  );
}

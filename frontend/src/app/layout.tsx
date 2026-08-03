import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
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
        <Navbar isAuthenticated={isAuthenticated} />
        <main className={STYLES.main}>{children}</main>
      </body>
    </html>
  );
}

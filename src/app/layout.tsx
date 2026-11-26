import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: {
    default: "Curryware Fantasy",
    template: "%s · Curryware Fantasy",
  },
  description: "Fantasy football leagues, teams and transactions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b border-black/10 dark:border-white/15">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Curryware Fantasy
            </Link>
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:text-foreground dark:text-zinc-400"
            >
              Leagues
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}

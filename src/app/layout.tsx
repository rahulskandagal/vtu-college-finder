import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CompareBar } from "@/components/college/compare-bar";
import { getSession } from "@/lib/auth/session";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: `${APP_NAME} — Engineering colleges & KCET cutoffs`, template: `%s | ${APP_NAME}` },
  description: APP_TAGLINE,
  keywords: ["KCET", "VTU", "engineering colleges Karnataka", "KCET cutoff", "college finder", "KCET rank predictor"],
  openGraph: { type: "website", siteName: APP_NAME, title: APP_NAME, description: APP_TAGLINE, url: APP_URL },
  twitter: { card: "summary_large_image", title: APP_NAME, description: APP_TAGLINE },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <Navbar session={session} />
        <main className="flex-1">{children}</main>
        <CompareBar />
        <Footer />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asseta — Shariah-Compliant Portfolio Manager",
  description: "Track your mutual fund investments, optimize allocation, and plan for financial independence.",
  manifest: "/manifest.json",
  icons: { apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        <div className="geo-pattern" aria-hidden="true" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

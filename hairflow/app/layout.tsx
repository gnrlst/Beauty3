import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f5f2ec" };

export const metadata: Metadata = {
  title: "B3 — учёт",
  description: "Простой учёт поступлений, обработки, перемещений и продаж волос.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head><link rel="preload" href="/fonts/editorial.woff" as="font" type="font/woff" crossOrigin="anonymous" /><link rel="preload" href="/fonts/sans.woff" as="font" type="font/woff" crossOrigin="anonymous" /></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

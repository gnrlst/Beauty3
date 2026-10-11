import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HairFlow — учёт компании",
  description: "Общая база закупок, производства, волос и продаж с правами сотрудников.",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "学食オーダー",
  description: "並ばずに注文・事前決済できる学食アプリ",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "学食オーダー" },
};

export const viewport: Viewport = {
  themeColor: "#e8722e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

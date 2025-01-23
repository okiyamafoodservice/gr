import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "シンセサイザー & シーケンサーアプリ",
  description: "Web Audio APIを使用した音楽制作アプリケーション",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

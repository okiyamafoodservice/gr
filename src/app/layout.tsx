import { DotGothic16 } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const dotGothic16 = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "browsMIDI",
  description: "Web Audio APIを使用した音楽制作アプリケーション",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={dotGothic16.className}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

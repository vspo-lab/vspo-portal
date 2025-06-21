import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "../src/features/footer/components/Footer";
import { NavigationHeader } from "../src/features/navigation/components/NavigationHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VSPO Collection - 推しコレ",
  description: "VSPOメンバーの切り抜き動画をみんなで楽しむプラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <NavigationHeader />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

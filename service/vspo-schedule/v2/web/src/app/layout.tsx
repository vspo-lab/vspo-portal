import "@fortawesome/fontawesome-svg-core/styles.css";
import "@/styles/globals.css";
import "@/styles/normalize.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import type { Metadata } from "next";

config.autoAddCss = false;

export const metadata: Metadata = {
  keywords:
    "VSPO!, Vspo, ぶいすぽっ！, ぶいすぽ, streaming schedule, 配信スケジュール, 直播时间表, 直播時間表, 스트리밍 일정, virtual esports, vtuber, esports, gaming",
  openGraph: {
    type: "website",
    images: "https://www.vspo-schedule.com/page-icon.png",
  },
  twitter: {
    card: "summary_large_image",
    images: "https://www.vspo-schedule.com/page-icon.png",
  },
  robots: "all",
  manifest: "/manifest.json",
  icons: { apple: "/icon.png" },
  other: { "theme-color": "#fff" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

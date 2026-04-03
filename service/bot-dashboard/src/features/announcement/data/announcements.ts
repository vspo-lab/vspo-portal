import { z } from "zod";

const AnnouncementSchema = z.object({
  id: z.string(),
  title: z.object({ ja: z.string(), en: z.string() }),
  body: z.object({ ja: z.string(), en: z.string() }),
  date: z.string(),
  type: z.enum(["info", "update", "maintenance"]),
});

type AnnouncementType = z.infer<typeof AnnouncementSchema>;

const announcements: readonly AnnouncementType[] = [
  {
    id: "2026-04-01-dashboard",
    title: {
      ja: "Webダッシュボードをリリースしました",
      en: "Web Dashboard Released",
    },
    body: {
      ja: "ブラウザからBot設定を管理できるようになりました。スラッシュコマンドの代わりにご利用ください。",
      en: "You can now manage Bot settings from your browser. Use this instead of slash commands.",
    },
    date: "2026-04-01T00:00:00Z",
    type: "update",
  },
  {
    id: "2026-03-15-multilang",
    title: {
      ja: "多言語通知に対応しました",
      en: "Multi-language Notifications Now Available",
    },
    body: {
      ja: "日本語・英語に加えて、フランス語・ドイツ語・スペイン語・中国語（簡体/繁体）・韓国語での通知に対応しました。",
      en: "Notifications are now available in French, German, Spanish, Simplified/Traditional Chinese, and Korean, in addition to Japanese and English.",
    },
    date: "2026-03-15T00:00:00Z",
    type: "update",
  },
  {
    id: "2026-03-01-launch",
    title: {
      ja: "すぽじゅーる Bot サービス開始",
      en: "Spodule Bot Service Launch",
    },
    body: {
      ja: "ぶいすぽっ!メンバーの配信予定をDiscordに自動通知するBotのサービスを開始しました。",
      en: "We've launched the bot service that automatically notifies VSPO member stream schedules to Discord.",
    },
    date: "2026-03-01T00:00:00Z",
    type: "info",
  },
] as const;

export { announcements, type AnnouncementType };

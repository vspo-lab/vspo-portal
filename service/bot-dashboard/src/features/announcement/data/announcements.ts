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
] as const;

export { type AnnouncementType, announcements };

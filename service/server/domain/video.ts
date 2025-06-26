import { formatToLocalizedDate, getCurrentUTCDate } from "@vspo-lab/dayjs";
import { z } from "zod";
import { ThumbnailURLSchema } from "./thumbnail";
import { TargetLangSchema } from "./translate";

const PlatformSchema = z.enum([
  "youtube",
  "twitch",
  "twitcasting",
  "niconico",
  "bilibili",
  "unknown",
]);

const platformIconURLs: Record<Platform, string> = {
  youtube:
    "https://raw.githubusercontent.com/sugar-cat7/vspo-portal/main/service/server/assets/icon/youtube.png",
  twitch:
    "https://raw.githubusercontent.com/sugar-cat7/vspo-portal/main/service/server/assets/icon/twitch.png",
  twitcasting:
    "https://raw.githubusercontent.com/sugar-cat7/vspo-portal/main/service/server/assets/icon/twitcasting.png",
  niconico:
    "https://raw.githubusercontent.com/sugar-cat7/vspo-portal/main/service/server/assets/icon/niconico.png",
  bilibili:
    "https://raw.githubusercontent.com/sugar-cat7/vspo-portal/main/service/server/assets/icon/bilibili.png",
  unknown: "",
};
const getPlatformIconURL = (platform: Platform): string => {
  return platformIconURLs[platform] ?? "";
};

// Base schema with common fields for Streams and Clips
const BaseVideoSchema = z.object({
  id: z.string(),
  rawId: z.string(),
  title: z.string(),
  languageCode: TargetLangSchema,
  rawChannelID: z.string(),
  description: z.string(),
  publishedAt: z.string().datetime(),
  platform: PlatformSchema,
  tags: z.array(z.string()),
  thumbnailURL: ThumbnailURLSchema,
  creatorName: z.string().optional(),
  creatorThumbnailURL: ThumbnailURLSchema.optional(),
  viewCount: z.number().int().nonnegative(),
  link: z.string().optional(), // Original link if provided from DB
  deleted: z.boolean().default(false),
  translated: z.boolean().optional(),
  videoPlayerLink: z.string().optional().nullable(),
  chatPlayerLink: z.string().optional().nullable(),
  duration: z.number().int().nonnegative().optional(), // Duration in seconds
});

// Type inference
type Platform = z.infer<typeof PlatformSchema>;

// Base type (Input)
type BaseVideoInput = z.input<typeof BaseVideoSchema>;

export {
  // Base Schemas
  BaseVideoSchema,
  PlatformSchema,
  // Base Types
  type Platform,
  type BaseVideoInput,
  // Helper functions
  getPlatformIconURL,
};

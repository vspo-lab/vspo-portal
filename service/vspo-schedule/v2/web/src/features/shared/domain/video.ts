import { z } from "zod";

// Platform types
export const platformSchema = z.enum([
  "youtube",
  "twitch",
  "twitcasting",
  "niconico",
  "unknown",
]);
export type Platform = z.infer<typeof platformSchema>;

// Video model
export const videoSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  platform: platformSchema,
  thumbnailUrl: z.string(),
  viewCount: z.number(),
  channelId: z.string(),
  channelTitle: z.string(),
  channelThumbnailUrl: z.string(),
  link: z.string(),
  tags: z.array(z.string()),
  // NOTE: Needs to be converted on the client side using convertVideoPlayerLink
  videoPlayerLink: z.string().optional(),
  // NOTE: Needs to be converted on the client side using convertChatPlayerLink
  chatPlayerLink: z.string().optional(),
});
export type Video = z.infer<typeof videoSchema>;

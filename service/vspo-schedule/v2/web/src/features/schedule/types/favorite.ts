import { z } from "zod";

export const favoriteSearchConditionSchema = z.object({
  memberType: z.enum(["vspo_jp", "vspo_en", "vspo_ch", "vspo_all", "general"]),
  platform: z.enum(["youtube", "twitch", "twitcasting", "niconico", ""]),
  createdAt: z.string(),
});

export type FavoriteSearchCondition = z.infer<
  typeof favoriteSearchConditionSchema
>;

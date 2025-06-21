export interface FavoriteSearchCondition {
  memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general";
  platform: "youtube" | "twitch" | "twitcasting" | "niconico" | "";
  createdAt: string;
}

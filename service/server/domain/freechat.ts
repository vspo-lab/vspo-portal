import { z } from "zod";
import { getChatEmbedUrl, getLivestreamEmbedUrl } from "./stream";
import { BaseVideoSchema, type Platform } from "./video";

// Function to get clip link
const getFreechatLink = (
  rawId: string,
  platform: Platform,
  channelId?: string, // May be needed for some platforms
): string => {
  switch (platform) {
    case "youtube": // YouTube clips might have /clip/ path, needs verification
      return `https://www.youtube.com/watch?v=${rawId}`; // Example structure
    case "twitch": // Twitch clips have a specific structure
      return `https://clips.twitch.tv/${rawId}`; // Standard Twitch clip URL
    // Add cases for twitcasting, niconico if they have distinct clip URLs
    // e.g. case "twitcasting": return `${platformLinks.twitcasting}${channelId}/clip/${rawId}`;
    default:
      // Fallback might be less reliable for clips
      console.warn(
        `Freechat link generation not implemented for platform: ${platform}`,
      );
      return ""; // Return empty or a best guess
  }
};

// Freechat Schema (extends Base, may add clip-specific fields later)
const FreechatSchema = BaseVideoSchema.transform((clip) => {
  const getPlatformIconURL = (platform: Platform): string => {
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
    return platformIconURLs[platform] ?? "";
  };

  const platformIconURL = getPlatformIconURL(clip.platform);
  // Attempt to generate a clip link if not provided in DB
  const generatedLink = getFreechatLink(
    clip.rawId,
    clip.platform,
    clip.rawChannelID,
  );

  const thumbnailURL = clip.thumbnailURL;

  const videoPlayerLink = getLivestreamEmbedUrl({
    platform: clip.platform,
    rawId: clip.rawId,
    link: clip.link || generatedLink,
    status: "ended",
    rawChannelID: clip.rawChannelID,
  });

  const chatPlayerLink = getChatEmbedUrl({
    platform: clip.platform,
    rawId: clip.rawId,
    link: clip.link || generatedLink,
  });

  return {
    ...clip,
    platformIconURL,
    link: clip.link || generatedLink, // Use DB link first, then generate
    thumbnailURL,
    videoPlayerLink,
    chatPlayerLink,
  };
});

// Array Schemas
const FreechatsSchema = z.array(FreechatSchema);

// Freechat types
type FreechatInput = z.input<typeof FreechatSchema>; // Includes Base + Freechat specifics
type Freechat = z.output<typeof FreechatSchema>; // Includes Base + Freechat specifics + transformed fields
type Freechats = z.output<typeof FreechatsSchema>;

// Creator functions
const createFreechat = (clip: FreechatInput): Freechat => {
  return FreechatSchema.parse(clip);
};
const createFreechats = (clips: FreechatInput[]): Freechats => {
  return FreechatsSchema.parse(clips);
};

export {
  // Schemas
  FreechatSchema,
  FreechatsSchema,
  // Types
  type FreechatInput,
  type Freechat,
  type Freechats,
  // Creator functions
  createFreechat,
  createFreechats,
  // Helper functions
  getFreechatLink,
};

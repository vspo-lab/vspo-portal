import { Platform } from "@/features/shared/domain/video";
import { z } from "zod";

// URL validation schema
export const urlSchema = z.object({
  url: z.string().url("無効なURLです"),
  platform: z.enum(["youtube", "twitch", "twitcasting", "niconico", "unknown"]),
  videoId: z.string(),
  isValid: z.boolean(),
  type: z.enum(["live", "vod", "unknown"]),
});

export type ParsedUrl = z.infer<typeof urlSchema>;

// Platform-specific URL patterns
const YOUTUBE_PATTERNS = {
  // YouTube live streams and videos
  standard:
    /^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:&.*)?$/,
  shortUrl: /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
  embed:
    /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
  shorts:
    /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
  live: /^https?:\/\/(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
  channel:
    /^https?:\/\/(?:www\.)?youtube\.com\/channel\/([a-zA-Z0-9_-]+)\/live(?:\?.*)?$/,
  user: /^https?:\/\/(?:www\.)?youtube\.com\/user\/([a-zA-Z0-9_-]+)\/live(?:\?.*)?$/,
  handle:
    /^https?:\/\/(?:www\.)?youtube\.com\/@([a-zA-Z0-9_-]+)\/live(?:\?.*)?$/,
};

const TWITCH_PATTERNS = {
  // Twitch live streams and VODs
  channel: /^https?:\/\/(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]{4,25})(?:\/.*)?$/,
  video: /^https?:\/\/(?:www\.)?twitch\.tv\/videos\/(\d+)(?:\?.*)?$/,
  clip: /^https?:\/\/(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]{4,25})\/clip\/([a-zA-Z0-9_-]+)(?:\?.*)?$/,
  embed:
    /^https?:\/\/player\.twitch\.tv\/\?(?:.*&)?(?:channel|video)=([a-zA-Z0-9_-]+)(?:&.*)?$/,
};

// Platform detection
export const detectPlatform = (url: string): Platform => {
  // YouTube detection
  for (const pattern of Object.values(YOUTUBE_PATTERNS)) {
    if (pattern.test(url)) {
      return "youtube";
    }
  }

  // Twitch detection
  for (const pattern of Object.values(TWITCH_PATTERNS)) {
    if (pattern.test(url)) {
      return "twitch";
    }
  }

  return "unknown";
};

// Extract video ID from YouTube URL
export const extractYouTubeVideoId = (url: string): string | null => {
  for (const [name, pattern] of Object.entries(YOUTUBE_PATTERNS)) {
    const match = url.match(pattern);
    if (match) {
      // For channel/user/handle patterns, we don't have a video ID
      if (["channel", "user", "handle"].includes(name)) {
        return match[1]; // Return the channel identifier
      }
      return match[1]; // Return the video ID
    }
  }
  return null;
};

// Extract channel/video ID from Twitch URL
export const extractTwitchId = (
  url: string,
): {
  type: "channel" | "video" | "clip";
  id: string;
  clipId?: string;
} | null => {
  // Check for video URL
  const videoMatch = url.match(TWITCH_PATTERNS.video);
  if (videoMatch) {
    return { type: "video", id: videoMatch[1] };
  }

  // Check for clip URL
  const clipMatch = url.match(TWITCH_PATTERNS.clip);
  if (clipMatch) {
    return { type: "clip", id: clipMatch[1], clipId: clipMatch[2] };
  }

  // Check for channel URL
  const channelMatch = url.match(TWITCH_PATTERNS.channel);
  if (channelMatch) {
    return { type: "channel", id: channelMatch[1] };
  }

  // Check for embed URL
  const embedMatch = url.match(TWITCH_PATTERNS.embed);
  if (embedMatch) {
    return { type: "channel", id: embedMatch[1] };
  }

  return null;
};

// Determine if URL is for live stream or VOD
export const determineStreamType = (
  url: string,
  platform: Platform,
): "live" | "vod" | "unknown" => {
  switch (platform) {
    case "youtube":
      // YouTube live URLs
      if (
        YOUTUBE_PATTERNS.live.test(url) ||
        YOUTUBE_PATTERNS.channel.test(url) ||
        YOUTUBE_PATTERNS.user.test(url) ||
        YOUTUBE_PATTERNS.handle.test(url)
      ) {
        return "live";
      }
      // YouTube Shorts are typically VODs
      if (YOUTUBE_PATTERNS.shorts.test(url)) {
        return "vod";
      }
      // Standard YouTube videos could be either - we'd need to check the API
      return "unknown";

    case "twitch":
      const twitchId = extractTwitchId(url);
      if (twitchId) {
        if (twitchId.type === "channel") {
          return "live";
        }
        if (twitchId.type === "video" || twitchId.type === "clip") {
          return "vod";
        }
      }
      return "unknown";

    default:
      return "unknown";
  }
};

// Main URL parsing function
export const parseUrl = (url: string): ParsedUrl => {
  try {
    // Basic URL validation
    new URL(url);
  } catch {
    return {
      url,
      platform: "unknown",
      videoId: "",
      isValid: false,
      type: "unknown",
    };
  }

  const platform = detectPlatform(url);
  let videoId = "";
  let isValid = false;

  switch (platform) {
    case "youtube":
      const youtubeId = extractYouTubeVideoId(url);
      if (youtubeId) {
        videoId = youtubeId;
        isValid = true;
      }
      break;

    case "twitch":
      const twitchId = extractTwitchId(url);
      if (twitchId) {
        videoId = twitchId.clipId || twitchId.id;
        isValid = true;
      }
      break;

    default:
      isValid = false;
      break;
  }

  const type = determineStreamType(url, platform);

  return {
    url,
    platform,
    videoId,
    isValid,
    type,
  };
};

// Generate embed URL for different platforms
export const generateEmbedUrl = (parsedUrl: ParsedUrl): string | null => {
  if (!parsedUrl.isValid) {
    return null;
  }

  const domain =
    typeof window !== "undefined" ? window.location.hostname : "localhost";

  switch (parsedUrl.platform) {
    case "youtube":
      return `https://www.youtube.com/embed/${parsedUrl.videoId}?autoplay=0&origin=${encodeURIComponent(`https://${domain}`)}`;

    case "twitch":
      const twitchId = extractTwitchId(parsedUrl.url);
      if (twitchId?.type === "channel") {
        return `https://player.twitch.tv/?channel=${parsedUrl.videoId}&parent=${domain}&autoplay=false`;
      } else if (twitchId?.type === "video") {
        return `https://player.twitch.tv/?video=${parsedUrl.videoId}&parent=${domain}&autoplay=false`;
      }
      return null;

    default:
      return null;
  }
};

// Generate chat URL for different platforms
export const generateChatUrl = (
  parsedUrl: ParsedUrl,
  isDarkMode = false,
): string | null => {
  if (!parsedUrl.isValid) {
    return null;
  }

  const domain =
    typeof window !== "undefined" ? window.location.hostname : "localhost";

  switch (parsedUrl.platform) {
    case "youtube":
      const themeParam = isDarkMode ? "&dark_theme=1" : "";
      return `https://www.youtube.com/live_chat?v=${parsedUrl.videoId}&embed_domain=${domain}${themeParam}`;

    case "twitch":
      const twitchId = extractTwitchId(parsedUrl.url);
      if (twitchId?.type === "channel") {
        const darkParam = isDarkMode ? "&darkpopout" : "";
        return `https://www.twitch.tv/embed/${parsedUrl.videoId}/chat?parent=${domain}${darkParam}`;
      }
      return null; // VODs don't have live chat

    default:
      return null;
  }
};

// Validation helpers
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isSupportedPlatform = (url: string): boolean => {
  const platform = detectPlatform(url);
  return platform !== "unknown";
};

// URL examples for help text
export const URL_EXAMPLES = {
  youtube: [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://www.youtube.com/live/dQw4w9WgXcQ",
    "https://www.youtube.com/@channel/live",
  ],
  twitch: [
    "https://www.twitch.tv/username",
    "https://www.twitch.tv/videos/123456789",
    "https://www.twitch.tv/username/clip/ClipName",
  ],
};

// Error messages
export const ERROR_MESSAGES = {
  INVALID_URL: "無効なURLです。正しいURLを入力してください。",
  UNSUPPORTED_PLATFORM:
    "サポートされていないプラットフォームです。YouTube、TwitchのURLを入力してください。",
  EXTRACT_FAILED: "動画IDの抽出に失敗しました。URLを確認してください。",
  NETWORK_ERROR: "ネットワークエラーが発生しました。接続を確認してください。",
  METADATA_FAILED: "動画情報の取得に失敗しました。",
} as const;

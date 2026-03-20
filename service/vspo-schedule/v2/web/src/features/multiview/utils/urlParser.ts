import { Platform, platformSchema } from "@/features/shared/domain/video";
import { z } from "zod";

// URL validation schema
const urlSchema = z.object({
  url: z.string().url("無効なURLです"),
  platform: platformSchema,
  videoId: z.string(),
  isValid: z.boolean(),
  type: z.enum(["live", "vod", "unknown"]),
});

type ParsedUrl = z.infer<typeof urlSchema>;

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

// Platform detection (internal)
const detectPlatform = (url: string): Platform => {
  for (const pattern of Object.values(YOUTUBE_PATTERNS)) {
    if (pattern.test(url)) {
      return "youtube";
    }
  }

  for (const pattern of Object.values(TWITCH_PATTERNS)) {
    if (pattern.test(url)) {
      return "twitch";
    }
  }

  return "unknown";
};

// Extract video ID from YouTube URL (internal)
const extractYouTubeVideoId = (url: string): string | null => {
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

// Extract channel/video ID from Twitch URL (internal)
const extractTwitchId = (
  url: string,
): {
  type: "channel" | "video" | "clip";
  id: string;
  clipId?: string;
} | null => {
  const videoMatch = url.match(TWITCH_PATTERNS.video);
  if (videoMatch) {
    return { type: "video", id: videoMatch[1] };
  }

  const clipMatch = url.match(TWITCH_PATTERNS.clip);
  if (clipMatch) {
    return { type: "clip", id: clipMatch[1], clipId: clipMatch[2] };
  }

  const channelMatch = url.match(TWITCH_PATTERNS.channel);
  if (channelMatch) {
    return { type: "channel", id: channelMatch[1] };
  }

  const embedMatch = url.match(TWITCH_PATTERNS.embed);
  if (embedMatch) {
    return { type: "channel", id: embedMatch[1] };
  }

  return null;
};

// Determine if URL is for live stream or VOD (internal)
const determineStreamType = (
  url: string,
  platform: Platform,
): "live" | "vod" | "unknown" => {
  switch (platform) {
    case "youtube":
      if (
        YOUTUBE_PATTERNS.live.test(url) ||
        YOUTUBE_PATTERNS.channel.test(url) ||
        YOUTUBE_PATTERNS.user.test(url) ||
        YOUTUBE_PATTERNS.handle.test(url)
      ) {
        return "live";
      }
      if (YOUTUBE_PATTERNS.shorts.test(url)) {
        return "vod";
      }
      return "unknown";

    case "twitch": {
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
    }

    default:
      return "unknown";
  }
};

/**
 * Parse a URL and extract platform, video ID, validity, and stream type.
 *
 * @precondition url must be a non-empty string
 * @postcondition Returns a ParsedUrl with platform detection and video ID extraction
 */
export const parseUrl = (url: string): ParsedUrl => {
  // try-catch: URL constructor throws on invalid input — used as a validation guard
  try {
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
    case "youtube": {
      const youtubeId = extractYouTubeVideoId(url);
      if (youtubeId) {
        videoId = youtubeId;
        isValid = true;
      }
      break;
    }

    case "twitch": {
      const twitchId = extractTwitchId(url);
      if (twitchId) {
        videoId = twitchId.clipId || twitchId.id;
        isValid = true;
      }
      break;
    }

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

import { Platform } from "@/features/shared/domain/video";

/**
 * Platform-specific URL parsing and embed utilities for multiview
 */

export interface PlatformConfig {
  platform: Platform;
  embedUrl?: string;
  chatUrl?: string;
  isLive: boolean;
  supportsChat: boolean;
  supportsAutoplay: boolean;
  requiresParentDomain: boolean;
}

/**
 * Parse platform-specific video URL and extract video ID
 */
export const parseVideoUrl = (
  url: string,
): { platform: Platform; videoId: string | null } => {
  const cleanUrl = url.trim();

  // YouTube patterns
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of youtubePatterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      return { platform: "youtube", videoId: match[1] };
    }
  }

  // Twitch patterns
  const twitchPatterns = [
    /twitch\.tv\/([a-zA-Z0-9_]+)(?:\?|$)/,
    /twitch\.tv\/videos\/(\d+)/,
    /player\.twitch\.tv\/\?channel=([a-zA-Z0-9_]+)/,
  ];

  for (const pattern of twitchPatterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      return { platform: "twitch", videoId: match[1] };
    }
  }

  return { platform: "unknown", videoId: null };
};

/**
 * Generate embed URL for a given platform and video ID
 */
export const generateEmbedUrl = (
  platform: Platform,
  videoId: string,
  options: {
    autoplay?: boolean;
    muted?: boolean;
    parentDomain?: string;
    startTime?: number;
    chat?: boolean;
  } = {},
): string => {
  const {
    autoplay = false,
    muted = true,
    parentDomain = typeof window !== "undefined"
      ? window.location.hostname
      : "localhost",
    startTime = 0,
  } = options;

  switch (platform) {
    case "youtube": {
      const params = new URLSearchParams();
      if (autoplay) params.set("autoplay", "1");
      if (muted) params.set("mute", "1");
      if (startTime > 0) params.set("start", startTime.toString());
      params.set("enablejsapi", "1");
      params.set("origin", `https://${parentDomain}`);
      params.set("modestbranding", "1");
      params.set("rel", "0");

      return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }

    case "twitch": {
      const params = new URLSearchParams();
      params.set("channel", videoId);
      params.set("parent", parentDomain);
      if (autoplay) params.set("autoplay", "true");
      if (muted) params.set("muted", "true");

      return `https://player.twitch.tv/?${params.toString()}`;
    }

    default:
      return "";
  }
};

/**
 * Get platform configuration for a given platform
 */
export const getPlatformConfig = (platform: Platform): PlatformConfig => {
  const configs: Record<Platform, PlatformConfig> = {
    youtube: {
      platform: "youtube",
      isLive: true,
      supportsChat: false, // Chat is integrated into the player
      supportsAutoplay: true,
      requiresParentDomain: true,
    },
    twitch: {
      platform: "twitch",
      isLive: true,
      supportsChat: true,
      supportsAutoplay: true,
      requiresParentDomain: true,
    },
    twitcasting: {
      platform: "twitcasting",
      isLive: true,
      supportsChat: false, // Chat is integrated into the player
      supportsAutoplay: false,
      requiresParentDomain: false,
    },
    niconico: {
      platform: "niconico",
      isLive: true,
      supportsChat: false, // Chat is integrated into the player
      supportsAutoplay: false,
      requiresParentDomain: false,
    },
    unknown: {
      platform: "unknown",
      isLive: false,
      supportsChat: false,
      supportsAutoplay: false,
      requiresParentDomain: false,
    },
  };

  return configs[platform] || configs.unknown;
};

/**
 * Validate if a URL is supported by the multiview system
 */
export const isValidMultiviewUrl = (url: string): boolean => {
  const { platform, videoId } = parseVideoUrl(url);
  return platform !== "unknown" && videoId !== null;
};

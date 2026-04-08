import { Platform } from "@/features/shared/domain/video";

/**
 * Generate embed URL for a given platform and video ID.
 *
 * @precondition platform must be "youtube", "twitch", or "twitcasting"; videoId must be non-empty
 * @postcondition Returns a valid embed URL string (empty string for unsupported platforms)
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

    case "twitcasting": {
      // Official docs: https://twitcasting.tv/twitcastinglive/communityshow/6557098
      const params = new URLSearchParams();
      params.set("auto_play", autoplay ? "true" : "false");
      params.set("default_mute", muted ? "true" : "false");
      return `https://twitcasting.tv/${encodeURIComponent(videoId)}/embeddedplayer/live?${params.toString()}`;
    }

    default:
      return "";
  }
};

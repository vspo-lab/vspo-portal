import type { Livestream } from "@/features/shared/domain";
import { parseUrl } from "./urlParser";

export interface MultiviewConfig {
  version: string;
  layout: string;
  videos: Array<{
    id: string;
    platform: string;
    url: string;
  }>;
}

export interface LoadedConfig {
  config: MultiviewConfig;
  videos: Livestream[];
  metadata: {
    version: string;
    loadedAt: string;
    source: "url-params" | "share-link" | "file-import" | "manual";
  };
}

export async function loadConfigFromUrl(
  configUrl: string,
): Promise<LoadedConfig> {
  // For now, just parse URLs from the config parameter
  const urls = configUrl.split(",").map((url) => decodeURIComponent(url));

  const videos: Livestream[] = urls.map((url, index) => {
    const parsed = parseUrl(url);
    return {
      id: `external-${index}`,
      type: "livestream" as const,
      status: "live" as const,
      platform: parsed.platform,
      link: url,
      title: `Stream ${index + 1}`,
      description: "",
      channelId: "",
      channelTitle: `Channel ${index + 1}`,
      viewCount: 0,
      tags: [],
      channelThumbnailUrl: "",
      thumbnailUrl: "",
      scheduledStartTime: new Date().toISOString(),
      scheduledEndTime: null,
      viewerCount: 0,
    };
  });

  return {
    config: {
      version: "1.0",
      layout: "grid-2x2",
      videos: videos.map((v) => ({
        id: v.id,
        platform: v.platform,
        url: v.link,
      })),
    },
    videos,
    metadata: {
      version: "1.0",
      loadedAt: new Date().toISOString(),
      source: "url-params",
    },
  };
}

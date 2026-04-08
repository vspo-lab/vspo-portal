"use client";

import { Livestream } from "@/features/shared/domain";
import { useTranslations } from "next-intl";
import React, { useState, useCallback } from "react";
import { generateEmbedUrl } from "../../utils/platformUtils";
import { UrlInputPresenter } from "../presenters";

/**
 * Fetch video metadata via oEmbed API (no API key required).
 *
 * @precondition url must be a valid YouTube or Twitch URL
 * @postcondition Returns { title, authorName } or null on failure
 */
const fetchOEmbedMetadata = async (
  url: string,
  platform: "youtube" | "twitch",
): Promise<{ title: string; authorName: string } | null> => {
  const oembedEndpoints: Record<string, string> = {
    youtube: `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    twitch: `https://api.twitch.tv/v5/oembed?url=${encodeURIComponent(url)}&format=json`,
  };

  const endpoint = oembedEndpoints[platform];
  if (!endpoint) return null;

  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const data: Record<string, unknown> = await response.json();
    return {
      title: typeof data.title === "string" ? data.title : "",
      authorName: typeof data.author_name === "string" ? data.author_name : "",
    };
  } catch {
    return null;
  }
};

export interface UrlInputProps {
  selectedStreams: Livestream[];
  maxStreams: number;
  onStreamAdd: (stream: Livestream) => void;
}

export const UrlInput: React.FC<UrlInputProps> = ({
  selectedStreams,
  maxStreams,
  onStreamAdd,
}) => {
  const t = useTranslations("multiview");
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const parseStreamFromUrl = useCallback(
    async (url: string): Promise<Livestream | null> => {
      // This is a simplified implementation
      // In a real app, you'd parse different platform URLs and fetch metadata
      try {
        const urlObj = new URL(url);

        // YouTube URL parsing
        if (
          urlObj.hostname.includes("youtube.com") ||
          urlObj.hostname.includes("youtu.be")
        ) {
          let videoId = "";

          if (urlObj.searchParams.has("v")) {
            videoId = urlObj.searchParams.get("v") || "";
          } else if (urlObj.hostname.includes("youtu.be")) {
            videoId = urlObj.pathname.slice(1);
          }

          if (videoId) {
            const meta = await fetchOEmbedMetadata(url, "youtube");
            return {
              id: videoId,
              type: "livestream" as const,
              channelId: "",
              channelTitle: meta?.authorName || "YouTube",
              title: meta?.title || videoId,
              description: "",
              platform: "youtube" as const,
              status: "live" as const,
              link: url,
              videoPlayerLink: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`,
              thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              channelThumbnailUrl: "",
              viewCount: 0,
              tags: [],
              scheduledStartTime: new Date().toISOString(),
              scheduledEndTime: null,
            };
          }
        }

        // Twitch URL parsing
        if (urlObj.hostname.includes("twitch.tv")) {
          const pathParts = urlObj.pathname.split("/");
          const channelName = pathParts[1];

          if (channelName) {
            const meta = await fetchOEmbedMetadata(url, "twitch");
            return {
              id: channelName,
              type: "livestream" as const,
              channelId: channelName,
              channelTitle: meta?.authorName || channelName,
              title: meta?.title || channelName,
              description: "",
              platform: "twitch" as const,
              status: "live" as const,
              link: url,
              videoPlayerLink: `https://player.twitch.tv/?channel=${channelName}&parent=${window.location.hostname}&autoplay=true&muted=true`,
              thumbnailUrl: "",
              channelThumbnailUrl: "",
              viewCount: 0,
              tags: [],
              scheduledStartTime: new Date().toISOString(),
              scheduledEndTime: null,
            };
          }
        }

        // Twitcasting URL parsing (e.g. https://twitcasting.tv/username)
        if (urlObj.hostname.includes("twitcasting.tv")) {
          const userName = urlObj.pathname.split("/")[1];

          if (userName) {
            return {
              id: userName,
              type: "livestream" as const,
              channelId: userName,
              channelTitle: userName,
              title: `${userName} (Twitcasting)`,
              description: "",
              platform: "twitcasting" as const,
              status: "live" as const,
              link: url,
              videoPlayerLink: generateEmbedUrl("twitcasting", userName),
              thumbnailUrl: "",
              channelThumbnailUrl: "",
              viewCount: 0,
              tags: [],
              scheduledStartTime: new Date().toISOString(),
              scheduledEndTime: null,
            };
          }
        }

        return null;
      } catch (error) {
        console.error("Error parsing URL:", error);
        return null;
      }
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!url.trim()) {
      setError(t("urlInput.error.emptyUrl"));
      return;
    }

    if (selectedStreams.length >= maxStreams) {
      setError(
        t("urlInput.error.maxStreams", { max: maxStreams }),
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const stream = await parseStreamFromUrl(url.trim());

      if (!stream) {
        setError(
          t("urlInput.error.unsupportedUrl"),
        );
        setIsLoading(false);
        return;
      }

      // Check if stream is already added
      const isAlreadyAdded = selectedStreams.some(
        (s) => s.id === stream.id || s.link === stream.link,
      );

      if (isAlreadyAdded) {
        setError(
          t("urlInput.error.alreadyAdded"),
        );
        setIsLoading(false);
        return;
      }

      onStreamAdd(stream);
      setUrl("");
      setError(null);
    } catch (error) {
      setError(t("urlInput.error.parseFailed"));
      console.error("Error adding stream from URL:", error);
    } finally {
      setIsLoading(false);
    }
  }, [url, selectedStreams, maxStreams, onStreamAdd, parseStreamFromUrl, t]);

  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl);
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    setUrl("");
    setError(null);
  }, []);

  return (
    <UrlInputPresenter
      url={url}
      isLoading={isLoading}
      error={error}
      selectedStreams={selectedStreams}
      maxStreams={maxStreams}
      onUrlChange={handleUrlChange}
      onSubmit={handleSubmit}
      onClear={handleClear}
    />
  );
};

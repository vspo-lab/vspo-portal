import { Livestream } from "@/features/shared/domain";
import { useTranslation } from "next-i18next";
import React, { useState, useCallback } from "react";
import { UrlInputPresenter } from "../presenters";

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
  const { t } = useTranslation("multiview");
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
            return {
              id: videoId,
              type: "livestream" as const,
              channelId: "", // Would be fetched from YouTube API
              channelTitle: "YouTube Stream",
              title: "Stream from URL",
              description: "Stream added from URL",
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
            return {
              id: channelName,
              type: "livestream" as const,
              channelId: channelName,
              channelTitle: channelName,
              title: "Twitch Stream",
              description: "Twitch stream added from URL",
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
      setError(t("urlInput.error.emptyUrl", "URLを入力してください"));
      return;
    }

    if (selectedStreams.length >= maxStreams) {
      setError(
        t(
          "urlInput.error.maxStreams",
          "最大{{max}}つまでの配信を選択できます",
          { max: maxStreams },
        ),
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const stream = await parseStreamFromUrl(url.trim());

      if (!stream) {
        setError(
          t("urlInput.error.unsupportedUrl", "サポートされていないURLです"),
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
          t("urlInput.error.alreadyAdded", "この配信は既に追加されています"),
        );
        setIsLoading(false);
        return;
      }

      onStreamAdd(stream);
      setUrl("");
      setError(null);
    } catch (error) {
      setError(t("urlInput.error.parseFailed", "URLの解析に失敗しました"));
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

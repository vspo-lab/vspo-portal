import { ContentLayout } from "@/features/shared/components/Layout";
import { Livestream } from "@/features/shared/domain";
import { NextPageWithLayout } from "@/pages/_app";
import React, { useEffect, useState, useCallback, useRef } from "react";

import { MultiviewErrorBoundary } from "../../components/containers";
import { PlaybackProvider } from "../../context/PlaybackContext";
import { useUrlConfigurationLoader } from "../../hooks/useConfigurationLoader";
import { LayoutType } from "../../hooks/useMultiviewLayout";
import { LoadedConfig } from "../../utils/configLoader";
import {
  expandCompactState,
  generateShareableUrl,
  hasUrlState,
  loadStateFromLocalStorage,
  parseCompactStateFromUrl,
  saveStateToLocalStorage,
} from "../../utils/stateManager";
import { Presenter } from "./presenter";

export type MultiviewPageProps = {
  livestreams: Livestream[];
  lastUpdateTimestamp: number;
  meta: {
    title: string;
    description: string;
  };
};

// Container component (page logic)
export const MultiviewPage: NextPageWithLayout<MultiviewPageProps> = (
  props,
) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedStreams, setSelectedStreams] = useState<Livestream[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>("auto");
  const [shareableUrl, setShareableUrl] = useState<string>("");

  // Configuration loader for handling shared URLs
  const configLoader = useUrlConfigurationLoader({
    onConfigLoaded: useCallback((loadedConfig: LoadedConfig) => {
      // Apply loaded configuration
      const config = loadedConfig.config;
      const videos = loadedConfig.videos;

      // Update selected streams - convert Video to Livestream
      const livestreams = videos.map((video) => ({
        ...video,
        type: "livestream" as const,
        status: "live" as const,
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: null,
      }));
      setSelectedStreams(livestreams);

      // Update layout
      setSelectedLayout(config.layout as LayoutType);
    }, []),
    onError: useCallback(() => {}, []),
  });

  // Load state on mount only (skip if already loaded)
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadInitialState = async () => {
      // First check URL state
      if (hasUrlState()) {
        const compactState = parseCompactStateFromUrl(window.location.href);
        if (compactState) {
          const expanded = expandCompactState(compactState, props.livestreams);
          if (expanded) {
            setSelectedStreams(expanded.streams);
            setSelectedLayout(expanded.layout);

            // Keep URL state for bookmarkability
            return;
          }
        }
      }

      // Then check localStorage
      const localState = loadStateFromLocalStorage();
      if (localState) {
        const restoredStreams = localState.selectedStreams.map((saved) => {
          const existing = props.livestreams.find((s) => s.id === saved.id);
          if (existing) return existing;

          // Create minimal Livestream object for external streams
          return {
            ...saved,
            type: "livestream" as const,
            status: "live" as const,
            description: "",
            thumbnailUrl: "",
            viewCount: 0,
            scheduledStartTime: new Date().toISOString(),
            scheduledEndTime: null,
            channelThumbnailUrl: "",
            videoPlayerLink: "",
            chatPlayerLink: "",
            tags: [],
          } as Livestream;
        });

        setSelectedStreams(restoredStreams);
        setSelectedLayout(localState.layout);

      }
    };

    loadInitialState();
  }, [props.livestreams]);

  // Save state when it changes (debounced to avoid blocking main thread)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (selectedStreams.length > 0) {
      // Generate shareable URL and keep address bar in sync
      const newUrl = generateShareableUrl(selectedStreams, selectedLayout);
      setShareableUrl(newUrl);

      // Update browser URL without triggering navigation
      try {
        window.history.replaceState({}, "", newUrl);
      } catch {
        // Silently ignore if URL update fails (e.g., SSR)
      }

      // Debounce localStorage write (synchronous / blocking)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveStateToLocalStorage(selectedStreams, selectedLayout);
      }, 500);
    }
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [selectedStreams, selectedLayout]);

  useEffect(() => {
    // Check if we have a loaded configuration, otherwise use default behavior
    if (configLoader.isReady && configLoader.state.loadedConfig) {
      setIsProcessing(false);
    } else if (!configLoader.state.isLoading && !configLoader.needsUserAction) {
      // No configuration loading in progress and no user action needed
      setIsProcessing(false);
    }
  }, [
    configLoader.isReady,
    configLoader.state.isLoading,
    configLoader.needsUserAction,
    configLoader.state.loadedConfig,
  ]);

  const handleStreamSelection = (stream: Livestream) => {
    setSelectedStreams((prev) => {
      const isAlreadySelected = prev.some((s) => s.id === stream.id);
      if (isAlreadySelected) {
        const newStreams = prev.filter((s) => s.id !== stream.id);
        return newStreams;
      }
      return [...prev, stream];
    });
  };

  const handleRemoveStream = (streamId: string) => {
    setSelectedStreams((prev) => {
      const newStreams = prev.filter((s) => s.id !== streamId);
      return newStreams;
    });
  };

  const handleLayoutChange = (layout: LayoutType) => {
    setSelectedLayout(layout);
  };

  const handleManualStreamAdd = (stream: Livestream) => {
    setSelectedStreams((prev) => {
      // Check if stream is already added
      const isAlreadySelected = prev.some(
        (s) => s.id === stream.id || s.link === stream.link,
      );
      if (isAlreadySelected) {
        return prev;
      }

      return [...prev, stream];
    });
  };

  // Chat cell state — tracks which stream IDs have a chat cell open
  const [chatStreamIds, setChatStreamIds] = useState<ReadonlySet<string>>(
    new Set<string>(),
  );

  /** Toggle a chat cell for the given stream ID. */
  const handleToggleChat = useCallback((streamId: string) => {
    setChatStreamIds((prev) => {
      const next = new Set(prev);
      if (next.has(streamId)) {
        next.delete(streamId);
      } else {
        next.add(streamId);
      }
      return next;
    });
  }, []);

  /** Remove a chat cell for the given stream ID. */
  const handleRemoveChat = useCallback((streamId: string) => {
    setChatStreamIds((prev) => {
      if (!prev.has(streamId)) return prev;
      const next = new Set(prev);
      next.delete(streamId);
      return next;
    });
  }, []);

  /** Replace all selected streams at once (used by preset restoration). */
  const handleRestoreStreams = useCallback((streams: Livestream[]) => {
    setSelectedStreams(streams);
    setChatStreamIds(new Set<string>());
  }, []);

  // When a stream is removed, also remove its chat cell
  const handleRemoveStreamWithChat = useCallback(
    (streamId: string) => {
      setSelectedStreams((prev) => prev.filter((s) => s.id !== streamId));
      handleRemoveChat(streamId);
    },
    [handleRemoveChat],
  );

  // Use the presenter component wrapped with PlaybackProvider and ErrorBoundary
  return (
    <MultiviewErrorBoundary>
      <PlaybackProvider>
        <Presenter
          livestreams={props.livestreams}
          selectedStreams={selectedStreams}
          chatStreamIds={chatStreamIds}
          selectedLayout={selectedLayout}
          isProcessing={isProcessing || configLoader.state.isLoading}
          shareableUrl={shareableUrl}
          onStreamSelection={handleStreamSelection}
          onRemoveStream={handleRemoveStreamWithChat}
          onLayoutChange={handleLayoutChange}
          onManualStreamAdd={handleManualStreamAdd}
          onRestoreStreams={handleRestoreStreams}
          onToggleChat={handleToggleChat}
          onRemoveChat={handleRemoveChat}
        />
      </PlaybackProvider>
    </MultiviewErrorBoundary>
  );
};

// Layout configuration
MultiviewPage.getLayout = (page, pageProps) => {
  return (
    <ContentLayout
      title={pageProps.meta.title}
      description={pageProps.meta.description}
      lastUpdateTimestamp={pageProps.lastUpdateTimestamp}
      path="/multiview"
      padTop={false}
      maxPageWidth={false}
    >
      {page}
    </ContentLayout>
  );
};

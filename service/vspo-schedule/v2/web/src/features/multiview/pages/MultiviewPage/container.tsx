"use client";

import { Livestream } from "@/features/shared/domain";
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
  resolveStream,
  saveStateToLocalStorage,
} from "../../utils/stateManager";
import { Presenter } from "./presenter";

export type MultiviewPageContainerProps = {
  livestreams: Livestream[];
  lastUpdateTimestamp: number;
};

// Container component (page logic)
export const MultiviewPageContainer: React.FC<MultiviewPageContainerProps> = (
  props,
) => {
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

  // Track whether the page was opened with a ?s= query parameter
  const openedWithUrlStateRef = useRef(false);

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
            openedWithUrlStateRef.current = true;
            setSelectedStreams(expanded.streams);
            setSelectedLayout(expanded.layout);
            return;
          }
        }
      }

      // Then check localStorage (don't write back to URL)
      const localState = loadStateFromLocalStorage();
      if (localState) {
        const restoredStreams = localState.selectedStreams.map((saved) =>
          resolveStream(saved, props.livestreams),
        );

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
      // Always generate shareable URL for the share button
      const newUrl = generateShareableUrl(selectedStreams, selectedLayout);
      setShareableUrl(newUrl);

      // Only sync URL bar if the page was opened with ?s= parameter
      if (openedWithUrlStateRef.current) {
        try {
          window.history.replaceState({}, "", newUrl);
        } catch {
          // Silently ignore if URL update fails
        }
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

  // Derived: processing while config is actively loading
  const isProcessing = configLoader.state.isLoading;

  const handleStreamSelection = useCallback((stream: Livestream) => {
    setSelectedStreams((prev) => {
      const isAlreadySelected = prev.some((s) => s.id === stream.id);
      if (isAlreadySelected) {
        return prev.filter((s) => s.id !== stream.id);
      }
      return [...prev, stream];
    });
  }, []);

  const handleRemoveStream = useCallback((streamId: string) => {
    setSelectedStreams((prev) => prev.filter((s) => s.id !== streamId));
  }, []);

  const handleLayoutChange = useCallback((layout: LayoutType) => {
    setSelectedLayout(layout);
  }, []);

  const handleManualStreamAdd = useCallback((stream: Livestream) => {
    setSelectedStreams((prev) => {
      const isAlreadySelected = prev.some(
        (s) => s.id === stream.id || s.link === stream.link,
      );
      if (isAlreadySelected) return prev;
      return [...prev, stream];
    });
  }, []);

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
          isProcessing={isProcessing}
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

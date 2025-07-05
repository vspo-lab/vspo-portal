import { ContentLayout } from "@/features/shared/components/Layout";
import type { Livestream } from "@/features/shared/domain";
import type { NextPageWithLayout } from "@/pages/_app";
import React, { useEffect, useState, useCallback } from "react";
import type GridLayout from "react-grid-layout";
import { PlaybackProvider } from "../../context/PlaybackContext";
import { useUrlConfigurationLoader } from "../../hooks/useConfigurationLoader";
import type { LayoutType } from "../../hooks/useMultiviewLayout";
import type { LoadedConfig } from "../../utils/configLoader";
import {
  clearUrlState,
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
  const [gridLayout, setGridLayout] = useState<
    Array<{ x: number; y: number; w: number; h: number }> | undefined
  >();

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

  // Load state on mount
  useEffect(() => {
    const loadInitialState = async () => {
      // First check URL state
      if (hasUrlState()) {
        const compactState = parseCompactStateFromUrl(window.location.href);
        if (compactState) {
          const expanded = expandCompactState(compactState, props.livestreams);
          if (expanded) {
            setSelectedStreams(expanded.streams);
            setSelectedLayout(expanded.layout);

            // Set grid layout if available
            if (compactState.g) {
              setGridLayout(compactState.g);
            }

            // Clear URL state after loading
            clearUrlState();
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

        // Restore grid layout if available
        if (localState.gridLayout) {
          setGridLayout(
            localState.gridLayout.map((item) => ({
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
            })),
          );
        }
      }
    };

    loadInitialState();
  }, [props.livestreams]);

  // Save state when it changes
  useEffect(() => {
    if (selectedStreams.length > 0) {
      // Convert grid layout to GridLayoutItem format if needed
      const gridLayoutItems = gridLayout
        ? gridLayout.map((item, index) => ({
            i: `stream-${index}`,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          }))
        : undefined;

      saveStateToLocalStorage(selectedStreams, selectedLayout, gridLayoutItems);
      setShareableUrl(
        generateShareableUrl(selectedStreams, selectedLayout, gridLayoutItems),
      );
    }
  }, [selectedStreams, selectedLayout, gridLayout]);

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
      if (prev.length < 9) {
        // Allow up to 9 streams for 3x3 layout
        const newStreams = [...prev, stream];
        return newStreams;
      }
      return prev;
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

  const handleStreamReorder = (activeId: string, overId: string) => {
    setSelectedStreams((prev) => {
      const activeIndex = prev.findIndex((s) => s.id === activeId);
      const overIndex = prev.findIndex((s) => s.id === overId);

      if (activeIndex === -1 || overIndex === -1) return prev;

      const newStreams = [...prev];
      [newStreams[activeIndex], newStreams[overIndex]] = [
        newStreams[overIndex],
        newStreams[activeIndex],
      ];
      return newStreams;
    });
  };

  const handleGridLayoutChange = (newLayout: GridLayout.Layout[]) => {
    // Extract only the position and size properties we need
    const simplifiedLayout = newLayout.map((item) => ({
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    }));
    setGridLayout(simplifiedLayout);
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

      // Check if we can add more streams (max 9 for 3x3 layout)
      if (prev.length >= 9) {
        return prev;
      }

      const newStreams = [...prev, stream];
      return newStreams;
    });
  };

  // Use the presenter component wrapped with PlaybackProvider
  return (
    <PlaybackProvider>
      <Presenter
        livestreams={props.livestreams}
        selectedStreams={selectedStreams}
        selectedLayout={selectedLayout}
        isProcessing={isProcessing || configLoader.state.isLoading}
        shareableUrl={shareableUrl}
        onStreamSelection={handleStreamSelection}
        onRemoveStream={handleRemoveStream}
        onLayoutChange={handleLayoutChange}
        onStreamReorder={handleStreamReorder}
        onManualStreamAdd={handleManualStreamAdd}
        onGridLayoutChange={handleGridLayoutChange}
        savedGridLayout={gridLayout}
      />
    </PlaybackProvider>
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
      // @ts-expect-error - false is needed to disable max-width constraint
      maxPageWidth={false}
    >
      {page}
    </ContentLayout>
  );
};

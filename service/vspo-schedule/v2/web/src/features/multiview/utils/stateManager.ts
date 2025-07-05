import type { Livestream } from "@/features/shared/domain";
import type { LayoutType } from "../hooks/useMultiviewLayout";

// Grid layout item for react-grid-layout
export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  static?: boolean;
}

export interface MultiviewState {
  selectedStreams: Array<{
    id: string;
    platform: string;
    channelId?: string;
    title: string;
    channelTitle: string;
    link: string;
  }>;
  layout: LayoutType;
  gridLayout?: GridLayoutItem[]; // Optional grid layout
  version: number;
}

// Compact state for URL (only essential data)
interface CompactMultiviewState {
  s: Array<{
    i: string; // id
    p: string; // platform
    c?: string; // channelId
  }>;
  l: string; // layout
  g?: Array<{
    // grid layout (optional)
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
  v: number; // version
}

const CURRENT_VERSION = 1;
const STORAGE_KEY = "vspo-multiview-state";

/**
 * Save multiview state to localStorage
 */
export const saveStateToLocalStorage = (
  selectedStreams: Livestream[],
  layout: LayoutType,
  gridLayout?: GridLayoutItem[],
): void => {
  try {
    const state: MultiviewState = {
      selectedStreams: selectedStreams.map((stream) => ({
        id: stream.id,
        platform: stream.platform,
        channelId: stream.channelId,
        title: stream.title,
        channelTitle: stream.channelTitle,
        link: stream.link,
      })),
      layout,
      gridLayout,
      version: CURRENT_VERSION,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save multiview state:", error);
  }
};

/**
 * Load multiview state from localStorage
 */
export const loadStateFromLocalStorage = (): MultiviewState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const state = JSON.parse(saved) as MultiviewState;

    // Check version compatibility
    if (state.version !== CURRENT_VERSION) {
      return null;
    }

    return state;
  } catch (error) {
    console.error("Failed to load multiview state:", error);
    return null;
  }
};

/**
 * Clear multiview state from localStorage
 */
export const clearStateFromLocalStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear multiview state:", error);
  }
};

/**
 * Generate shareable URL with state
 */
export const generateShareableUrl = (
  selectedStreams: Livestream[],
  layout: LayoutType,
  gridLayout?: GridLayoutItem[],
): string => {
  try {
    // Create compact state with only essential data (no Japanese text)
    const compactState: CompactMultiviewState = {
      s: selectedStreams.map((stream) => ({
        i: stream.id,
        p: stream.platform,
        c: stream.channelId,
      })),
      l: layout,
      v: CURRENT_VERSION,
    };

    // Add grid layout if available (only essential properties)
    if (gridLayout && gridLayout.length > 0) {
      compactState.g = gridLayout.map((item) => ({
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      }));
    }

    // Simple base64 encoding (no Unicode issues since we're only using IDs)
    const encoded = btoa(JSON.stringify(compactState));

    const url = new URL(window.location.href);
    url.searchParams.set("state", encoded);

    return url.toString();
  } catch (error) {
    console.error("Failed to generate shareable URL:", error);
    return window.location.href;
  }
};

/**
 * Parse state from URL (returns compact state)
 */
export const parseCompactStateFromUrl = (
  url: string,
): CompactMultiviewState | null => {
  try {
    const urlObj = new URL(url);
    const encoded = urlObj.searchParams.get("state");

    if (!encoded) return null;

    const decoded = atob(encoded);
    const compactState = JSON.parse(decoded) as CompactMultiviewState;

    // Check version compatibility
    if (compactState.v !== CURRENT_VERSION) {
      return null;
    }

    return compactState;
  } catch (error) {
    console.error("Failed to parse state from URL:", error);
    return null;
  }
};

/**
 * Check if URL has state parameter
 */
export const hasUrlState = (): boolean => {
  const url = new URL(window.location.href);
  return url.searchParams.has("state");
};

/**
 * Clear state from URL
 */
export const clearUrlState = (): void => {
  const url = new URL(window.location.href);
  url.searchParams.delete("state");
  window.history.replaceState({}, "", url.toString());
};

/**
 * Convert compact state to full state by finding streams
 */
export const expandCompactState = (
  compactState: CompactMultiviewState,
  availableStreams: Livestream[],
): {
  streams: Livestream[];
  layout: LayoutType;
  gridLayout?: Array<{ x: number; y: number; w: number; h: number }>;
} | null => {
  try {
    const streams: Livestream[] = [];

    for (const compactStream of compactState.s) {
      // First try to find by ID
      let stream = availableStreams.find((s) => s.id === compactStream.i);

      // If not found and has channelId, try to find by channelId and platform
      if (!stream && compactStream.c) {
        stream = availableStreams.find(
          (s) =>
            s.channelId === compactStream.c && s.platform === compactStream.p,
        );
      }

      // If still not found, create a minimal stream object
      if (!stream) {
        // For external streams that were added via URL
        stream = {
          id: compactStream.i,
          type: "livestream" as const,
          title: compactStream.i, // Use ID as title temporarily
          description: "",
          platform: compactStream.p as Livestream["platform"],
          thumbnailUrl: "",
          viewCount: 0,
          status: "live" as const,
          scheduledStartTime: new Date().toISOString(),
          scheduledEndTime: null,
          channelId: compactStream.c || compactStream.i,
          channelTitle: compactStream.c || compactStream.i,
          channelThumbnailUrl: "",
          link: "",
          videoPlayerLink: "",
          chatPlayerLink: "",
          tags: [],
        };
      }

      streams.push(stream);
    }

    return {
      streams,
      layout: compactState.l as LayoutType,
      gridLayout: compactState.g,
    };
  } catch (error) {
    console.error("Failed to expand compact state:", error);
    return null;
  }
};

import { z } from "zod";
import { getCurrentUTCString } from "@vspo-lab/dayjs";
import { type Platform, Livestream, platformSchema } from "@/features/shared/domain";
import { LayoutType } from "../hooks/useMultiviewLayout";

/**
 * Synchronous variant of `wrap` for localStorage / JSON.parse operations.
 * Returns { val } on success, { err } on failure.
 */
const wrapSync = <T>(fn: () => T, label: string): { val: T; err?: never } | { val?: never; err: Error } => {
  try {
    return { val: fn() };
  } catch (e) {
    console.error(`${label}:`, e);
    return { err: e instanceof Error ? e : new Error(String(e)) };
  }
};

// Grid layout item for react-grid-layout
export type GridLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  static?: boolean;
};

export type MultiviewState = {
  selectedStreams: Array<{
    id: string;
    platform: string;
    channelId?: string;
    title: string;
    channelTitle: string;
    link: string;
  }>;
  layout: LayoutType;
  gridLayout?: GridLayoutItem[];
  version: number;
};

// Compact state for URL (only essential data)
type CompactMultiviewState = {
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
};

// Validation helpers using shared schemas
const VALID_LAYOUTS: LayoutType[] = ["1x1", "2x1", "1x2", "2x2", "3x3", "4x3", "picture-in-picture", "auto"];

/** Type guard: checks if a string is a valid platform using shared platformSchema. */
const isValidPlatform = (value: string): value is Platform =>
  platformSchema.safeParse(value).success;

/** Type guard: checks if a string is a valid LayoutType. */
const isValidLayout = (value: string): value is LayoutType =>
  (VALID_LAYOUTS as ReadonlyArray<string>).includes(value);

const multiviewStateSchema = z.object({
  selectedStreams: z.array(z.object({
    id: z.string(),
    platform: z.string(),
    channelId: z.string().optional(),
    title: z.string(),
    channelTitle: z.string(),
    link: z.string(),
  })),
  layout: z.string().refine((val): val is LayoutType => isValidLayout(val)),
  gridLayout: z.array(z.object({
    i: z.string(),
    x: z.number().finite(),
    y: z.number().finite(),
    w: z.number().finite().positive(),
    h: z.number().finite().positive(),
    minW: z.number().optional(),
    minH: z.number().optional(),
    static: z.boolean().optional(),
  })).optional(),
  version: z.number(),
});

const customLayoutPresetsSchema = z.array(z.object({
  name: z.string(),
  layout: z.object({
    type: z.string().refine((val): val is LayoutType => isValidLayout(val)),
    gridPositions: z.array(z.object({
      i: z.string(),
      x: z.number().finite(),
      y: z.number().finite(),
      w: z.number().finite().positive(),
      h: z.number().finite().positive(),
    })),
  }),
  streams: z.array(z.object({
    id: z.string(),
    platform: z.string(),
    channelId: z.string().optional(),
    title: z.string(),
    channelTitle: z.string(),
    link: z.string(),
  })).optional(),
}));

const compactStreamSchema = z.object({
  i: z.string().min(1),
  p: z.string().min(1),
  c: z.string().optional(),
});

const compactStateSchema = z.object({
  s: z.array(compactStreamSchema).min(1),
  l: z.string().min(1),
  v: z.number(),
  g: z.array(z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    w: z.number().finite().positive(),
    h: z.number().finite().positive(),
  })).optional(),
});

const CURRENT_VERSION = 2;
const STORAGE_KEY = "vspo-multiview-state";
const CUSTOM_LAYOUTS_KEY = "vspo-multiview-custom-layouts";
const MAX_CUSTOM_LAYOUTS = 10;

/** Snapshot of stream fields needed for persistence (localStorage, URL, presets). */
export type StreamSnapshot = {
  id: string;
  platform: string;
  channelId?: string;
  title: string;
  channelTitle: string;
  link: string;
};

/** Extract persistable fields from a Livestream. */
export const toStreamSnapshot = (stream: Livestream): StreamSnapshot => ({
  id: stream.id,
  platform: stream.platform,
  channelId: stream.channelId,
  title: stream.title,
  channelTitle: stream.channelTitle,
  link: stream.link,
});

/**
 * Create a minimal Livestream from a snapshot, preferring live server data.
 *
 * @precondition snapshot must have at least id and platform
 * @postcondition Returns a valid Livestream object
 */
export const resolveStream = (
  snapshot: StreamSnapshot,
  availableStreams: ReadonlyArray<Livestream>,
): Livestream => {
  const existing = availableStreams.find((s) => s.id === snapshot.id);
  if (existing) return existing;

  // type-safe: snapshot.platform is string but Livestream requires Platform;
  // the VALID_PLATFORMS guard in expandCompactState ensures only valid platforms reach here
  return {
    ...snapshot,
    type: "livestream" as const,
    status: "live" as const,
    description: "",
    thumbnailUrl: "",
    viewCount: 0,
    scheduledStartTime: getCurrentUTCString(),
    scheduledEndTime: null,
    channelThumbnailUrl: "",
    videoPlayerLink: "",
    chatPlayerLink: "",
    tags: [],
  } as Livestream;
};

// Custom layout preset
export type CustomLayoutPreset = {
  name: string;
  layout: {
    type: LayoutType;
    gridPositions: Array<{
      i: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }>;
  };
  /** Saved streams for full restoration. Optional for backward compatibility. */
  streams?: Array<{
    id: string;
    platform: string;
    channelId?: string;
    title: string;
    channelTitle: string;
    link: string;
  }>;
};

/**
 * Save a custom layout preset to localStorage.
 *
 * @precondition name must be non-empty, layout.gridPositions must not be empty
 * @postcondition Preset is persisted; oldest preset is evicted if over MAX_CUSTOM_LAYOUTS
 */
export const saveCustomLayout = (
  name: string,
  layout: CustomLayoutPreset["layout"],
  streams?: CustomLayoutPreset["streams"],
): void => {
  wrapSync(() => {
    const existing = loadCustomLayouts();
    // Remove duplicate by name (immutable filter)
    const filtered = existing.filter((preset) => preset.name !== name);
    const updated = [...filtered, { name, layout, streams }];
    // Keep only the most recent MAX_CUSTOM_LAYOUTS
    const trimmed =
      updated.length > MAX_CUSTOM_LAYOUTS
        ? updated.slice(updated.length - MAX_CUSTOM_LAYOUTS)
        : updated;
    localStorage.setItem(CUSTOM_LAYOUTS_KEY, JSON.stringify(trimmed));
  }, "Failed to save custom layout");
};

/**
 * Load all custom layout presets from localStorage.
 *
 * @postcondition Returns an array of presets (empty array if none or on error)
 */
export const loadCustomLayouts = (): ReadonlyArray<CustomLayoutPreset> => {
  const result = wrapSync(() => {
    const saved = localStorage.getItem(CUSTOM_LAYOUTS_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    const validated = customLayoutPresetsSchema.safeParse(parsed);
    if (!validated.success) {
      console.error("Invalid custom layouts in localStorage:", validated.error.message);
      return [];
    }
    // type-safe: Zod schema structurally matches CustomLayoutPreset; readonly widening is safe
    return validated.data as ReadonlyArray<CustomLayoutPreset>;
  }, "Failed to load custom layouts");
  return result.val ?? [];
};

/**
 * Delete a custom layout preset by name.
 *
 * @precondition name must be non-empty
 * @postcondition The preset with the given name is removed from localStorage
 */
export const deleteCustomLayout = (name: string): void => {
  wrapSync(() => {
    const existing = loadCustomLayouts();
    const filtered = existing.filter((preset) => preset.name !== name);
    localStorage.setItem(CUSTOM_LAYOUTS_KEY, JSON.stringify(filtered));
  }, "Failed to delete custom layout");
};

// Platform abbreviations for compact URLs
const PLATFORM_TO_SHORT: Record<string, string> = {
  youtube: "y",
  twitch: "t",
  twitcasting: "c",
  niconico: "n",
};

const SHORT_TO_PLATFORM: Record<string, string> = Object.fromEntries(
  Object.entries(PLATFORM_TO_SHORT).map(([k, v]) => [v, k]),
);

/** base64url encode (URL-safe, no padding) */
const toBase64Url = (str: string): string =>
  btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** base64url decode */
const fromBase64Url = (str: string): string => {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
};

/**
 * Serialize state into a compact pipe-delimited string, then base64url encode.
 *
 * Internal format: `version|layout|id.platform.channelId,id.platform.channelId|x.y.w.h;x.y.w.h`
 * Output: base64url encoded string (URL-safe characters only: A-Z, a-z, 0-9, -, _)
 *
 * ~60-70% shorter than JSON+base64 thanks to eliminating JSON syntax overhead
 * and using single-char platform abbreviations.
 */
const encodeCompactUrl = (compactState: CompactMultiviewState): string => {
  const parts: string[] = [];

  // Part 0: version
  parts.push(String(compactState.v));

  // Part 1: layout
  parts.push(compactState.l);

  // Part 2: streams (id.platform.channelId separated by comma)
  const streams = compactState.s
    .map((s) => {
      const platformShort = PLATFORM_TO_SHORT[s.p] || s.p;
      const channelId = s.c || "";
      return `${s.i}.${platformShort}.${channelId}`;
    })
    .join(",");
  parts.push(streams);

  // Part 3: grid layout (optional, x.y.w.h separated by semicolons)
  if (compactState.g && compactState.g.length > 0) {
    const grid = compactState.g
      .map((item) => `${item.x}.${item.y}.${item.w}.${item.h}`)
      .join(";");
    parts.push(grid);
  }

  return toBase64Url(parts.join("|"));
};

/**
 * Decode a base64url-encoded compact string back into CompactMultiviewState.
 */
const decodeCompactUrl = (encoded: string): CompactMultiviewState | null => {
  const decoded = wrapSync(() => {
    const parts = fromBase64Url(encoded).split("|");
    if (parts.length < 3) return null;

    const version = Number.parseInt(parts[0], 10);
    const layout = parts[1];
    const streamsStr = parts[2];

    const streams = streamsStr.split(",").map((s) => {
      const [id, platformShort, channelId] = s.split(".", 3);
      const platform = SHORT_TO_PLATFORM[platformShort] || platformShort;
      return {
        i: id,
        p: platform,
        ...(channelId ? { c: channelId } : {}),
      };
    });

    // mutable: assigned to before return
    const result: CompactMultiviewState = {
      s: streams,
      l: layout,
      v: version,
    };

    // Parse grid layout if present
    if (parts[3]) {
      result.g = parts[3].split(";").map((item) => {
        const [x, y, w, h] = item.split(".").map(Number);
        return { x, y, w, h };
      });
    }

    const validated = compactStateSchema.safeParse(result);
    if (!validated.success) return null;
    // type-safe: compactStateSchema and CompactMultiviewState are structurally identical
    return validated.data as CompactMultiviewState;
  }, "Failed to decode compact URL");
  return decoded.val ?? null;
};

/**
 * Save multiview state to localStorage
 */
export const saveStateToLocalStorage = (
  selectedStreams: Livestream[],
  layout: LayoutType,
  gridLayout?: GridLayoutItem[],
): void => {
  wrapSync(() => {
    const state = {
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
    } satisfies MultiviewState;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, "Failed to save multiview state");
};

/**
 * Load multiview state from localStorage
 */
export const loadStateFromLocalStorage = (): MultiviewState | null => {
  const loaded = wrapSync(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    const result = multiviewStateSchema.safeParse(parsed);
    if (!result.success) {
      console.error("Invalid multiview state in localStorage:", result.error.message);
      return null;
    }
    // type-safe: Zod refine() on layout narrows to LayoutType but is not reflected in z.infer
    const state = result.data as MultiviewState;

    if (state.version !== CURRENT_VERSION) {
      return null;
    }

    return state;
  }, "Failed to load multiview state");
  return loaded.val ?? null;
};

/**
 * Generate shareable URL with compressed state.
 *
 * Uses a compact pipe-delimited format instead of JSON to minimize URL length.
 * Example: `2|2x2|abc123.y.ch1,def456.t.ch2|0.0.6.8;6.0.6.8`
 *
 * @precondition selectedStreams must not be empty
 * @postcondition Returns a valid URL string with `s` query parameter
 */
export const generateShareableUrl = (
  selectedStreams: Livestream[],
  layout: LayoutType,
  gridLayout?: GridLayoutItem[],
): string => {
  const result = wrapSync(() => {
    // mutable: assigned to before return
    const compactState: CompactMultiviewState = {
      s: selectedStreams.map((stream) => ({
        i: stream.id,
        p: stream.platform,
        c: stream.channelId,
      })),
      l: layout,
      v: CURRENT_VERSION,
    };

    if (gridLayout && gridLayout.length > 0) {
      compactState.g = gridLayout.map((item) => ({
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      }));
    }

    const encoded = encodeCompactUrl(compactState);

    const url = new URL(window.location.href);
    url.searchParams.set("s", encoded);

    return url.toString();
  }, "Failed to generate shareable URL");
  return result.val ?? window.location.href;
};

/**
 * Parse state from URL
 */
export const parseCompactStateFromUrl = (
  url: string,
): CompactMultiviewState | null => {
  const result = wrapSync(() => {
    const encoded = new URL(url).searchParams.get("s");
    if (!encoded) return null;
    return decodeCompactUrl(encoded);
  }, "Failed to parse state from URL");
  return result.val ?? null;
};

/**
 * Check if URL has state parameter
 */
export const hasUrlState = (): boolean => {
  return new URL(window.location.href).searchParams.has("s");
};

/**
 * Clear state from URL
 */
export const clearUrlState = (): void => {
  const url = new URL(window.location.href);
  url.searchParams.delete("s");
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
  const result = wrapSync(() => {
    const streams: Livestream[] = [];

    for (const compactStream of compactState.s) {
      // Try by ID, then by channelId+platform
      let stream = availableStreams.find((s) => s.id === compactStream.i);
      if (!stream && compactStream.c) {
        stream = availableStreams.find(
          (s) =>
            s.channelId === compactStream.c && s.platform === compactStream.p,
        );
      }

      streams.push(
        stream ??
          resolveStream(
            {
              id: compactStream.i,
              platform: (isValidPlatform(compactStream.p) ? compactStream.p : "unknown"),
              channelId: compactStream.c || compactStream.i,
              title: compactStream.i,
              channelTitle: compactStream.c || compactStream.i,
              link: "",
            },
            [],
          ),
      );
    }

    return {
      streams,
      layout: isValidLayout(compactState.l) ? compactState.l : "auto",
      gridLayout: compactState.g,
    };
  }, "Failed to expand compact state");
  return result.val ?? null;
};

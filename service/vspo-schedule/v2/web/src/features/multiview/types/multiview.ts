import { videoSchema } from "@/features/shared/domain/video";
import { z } from "zod";

// Layout types for multiview arrangements
export const multiviewLayoutSchema = z.enum([
  "grid-2x2", // 2x2 grid layout
  "grid-3x3", // 3x3 grid layout
  "grid-2x1", // 2x1 horizontal layout
  "grid-1x2", // 1x2 vertical layout
  "picture-in-picture", // Main video with smaller overlay videos
  "side-by-side", // Two videos side by side
  "theater-mode", // Main video with chat panels
  "custom", // Custom user-defined layout
]);
export type MultiviewLayout = z.infer<typeof multiviewLayoutSchema>;

// Position and size configuration for video panels
export const panelPositionSchema = z.object({
  x: z.number().min(0).max(100), // Percentage-based positioning (0-100)
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100), // Percentage-based sizing (1-100)
  height: z.number().min(1).max(100),
  zIndex: z.number().int().min(0).default(0), // Layering for overlapping panels
});
export type PanelPosition = z.infer<typeof panelPositionSchema>;

// Video panel configuration
export const videoPanelSchema = z.object({
  id: z.string(), // Unique identifier for the panel
  videoId: z.string(), // Reference to video ID
  position: panelPositionSchema,
  volume: z.number().min(0).max(1).default(0.5), // Volume level (0-1)
  muted: z.boolean().default(true), // Whether the panel is muted
  showChat: z.boolean().default(false), // Whether to show chat for this video
  showControls: z.boolean().default(true), // Whether to show video controls
  aspectRatio: z.enum(["16:9", "4:3", "1:1", "auto"]).default("16:9"),
  borderRadius: z.number().min(0).default(8), // Corner radius in pixels
  borderWidth: z.number().min(0).default(0), // Border thickness in pixels
  borderColor: z.string().default("#000000"), // Border color (hex)
  opacity: z.number().min(0).max(1).default(1), // Panel opacity
});
export type VideoPanel = z.infer<typeof videoPanelSchema>;

// Chat panel configuration for displaying chat alongside videos
export const chatPanelSchema = z.object({
  id: z.string(),
  videoId: z.string(), // Associated video ID for chat
  position: panelPositionSchema,
  fontSize: z.enum(["small", "medium", "large"]).default("medium"),
  showTimestamps: z.boolean().default(true),
  showUsernames: z.boolean().default(true),
  backgroundColor: z.string().default("#ffffff"),
  textColor: z.string().default("#000000"),
  maxMessages: z.number().int().min(1).max(1000).default(100),
});
export type ChatPanel = z.infer<typeof chatPanelSchema>;

// Audio configuration for handling multiple audio sources
export const audioConfigSchema = z
  .object({
    primaryVideoId: z.string().optional(), // Which video should be the primary audio source
    mixMode: z.enum(["single", "mixed", "ducking"]).default("single"), // How to handle multiple audio sources
    globalVolume: z.number().min(0).max(1).default(0.7), // Master volume control
    duckingLevel: z.number().min(0).max(1).default(0.3), // Volume level for secondary audio in ducking mode
  })
  .default({
    mixMode: "single",
    globalVolume: 0.7,
    duckingLevel: 0.3,
  });
export type AudioConfig = z.infer<typeof audioConfigSchema>;

// Main multiview configuration
export const multiviewConfigSchema = z.object({
  id: z.string(), // Unique identifier for the multiview configuration
  name: z.string().min(1).max(100), // User-friendly name for the configuration
  description: z.string().max(500).optional(), // Optional description
  layout: multiviewLayoutSchema,
  videoPanels: z.array(videoPanelSchema).min(1).max(16), // Support up to 16 video panels
  chatPanels: z.array(chatPanelSchema).optional().default([]),
  audioConfig: audioConfigSchema,
  backgroundColor: z.string().default("#000000"), // Background color for the multiview
  syncPlayback: z.boolean().default(false), // Whether to synchronize video playback
  autoplay: z.boolean().default(false), // Whether to autoplay videos when loaded
  showGrid: z.boolean().default(false), // Whether to show grid lines for positioning
  snapToGrid: z.boolean().default(true), // Whether panels snap to grid positions
  gridSize: z.number().int().min(5).max(50).default(10), // Grid size for snapping (percentage)
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().optional(), // User ID who created this configuration
});
export type MultiviewConfig = z.infer<typeof multiviewConfigSchema>;

// Preset layout configurations for common use cases
export const presetLayoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  layout: multiviewLayoutSchema,
  videoPanelTemplates: z.array(
    z.object({
      position: panelPositionSchema,
      defaultVolume: z.number().min(0).max(1).default(0.5),
      defaultMuted: z.boolean().default(true),
      showChat: z.boolean().default(false),
    }),
  ),
  chatPanelTemplates: z
    .array(
      z.object({
        position: panelPositionSchema,
        fontSize: z.enum(["small", "medium", "large"]).default("medium"),
      }),
    )
    .optional()
    .default([]),
  maxVideos: z.number().int().min(1).max(16),
  category: z
    .enum(["gaming", "collab", "events", "general"])
    .default("general"),
  thumbnail: z.string().optional(), // Preview image for the preset
});
export type PresetLayout = z.infer<typeof presetLayoutSchema>;

// Multiview session state for managing runtime data
export const multiviewSessionSchema = z.object({
  id: z.string(),
  configId: z.string(), // Reference to the multiview configuration
  videos: z.array(videoSchema), // Current videos loaded in the session
  currentStates: z.record(
    z.string(),
    z.object({
      isPlaying: z.boolean().default(false),
      currentTime: z.number().min(0).default(0),
      duration: z.number().min(0).default(0),
      buffering: z.boolean().default(false),
      error: z.string().optional(),
    }),
  ), // Runtime state for each video (keyed by video ID)
  globalPlayState: z.enum(["playing", "paused", "stopped"]).default("stopped"),
  startedAt: z.string().datetime().optional(),
  lastInteraction: z.string().datetime().optional(),
});
export type MultiviewSession = z.infer<typeof multiviewSessionSchema>;

// URL sharing and import/export functionality
export const shareableMultiviewSchema = z.object({
  version: z.string().default("1.0"), // Schema version for backward compatibility
  config: multiviewConfigSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
  }),
  videos: z.array(
    videoSchema.pick({
      id: true,
      title: true,
      platform: true,
      link: true,
      videoPlayerLink: true,
      chatPlayerLink: true,
      channelTitle: true,
    }),
  ), // Minimal video data needed for sharing
  sharedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(), // Optional expiration for shared links
});
export type ShareableMultiview = z.infer<typeof shareableMultiviewSchema>;

// URL parameter schema for direct multiview links
export const multiviewUrlParamsSchema = z.object({
  videos: z.string(), // Comma-separated video IDs or URLs
  layout: multiviewLayoutSchema.optional(),
  config: z.string().optional(), // Base64 encoded configuration
  preset: z.string().optional(), // Preset layout ID
  autoplay: z.boolean().optional(),
  muted: z.boolean().optional(),
});
export type MultiviewUrlParams = z.infer<typeof multiviewUrlParamsSchema>;

// User preferences for multiview functionality
export const multiviewPreferencesSchema = z.object({
  defaultLayout: multiviewLayoutSchema.default("grid-2x2"),
  defaultAudioConfig: audioConfigSchema,
  autoSaveConfigs: z.boolean().default(true),
  showTooltips: z.boolean().default(true),
  enableKeyboardShortcuts: z.boolean().default(true),
  defaultSnapToGrid: z.boolean().default(true),
  defaultGridSize: z.number().int().min(5).max(50).default(10),
  maxSavedConfigs: z.number().int().min(1).max(50).default(20),
  theme: z.enum(["light", "dark", "auto"]).default("auto"),
});
export type MultiviewPreferences = z.infer<typeof multiviewPreferencesSchema>;

// Validation utilities and helper functions
export const validateMultiviewConfig = (config: unknown): MultiviewConfig => {
  return multiviewConfigSchema.parse(config);
};

export const validateShareableMultiview = (
  data: unknown,
): ShareableMultiview => {
  return shareableMultiviewSchema.parse(data);
};

export const validateUrlParams = (params: unknown): MultiviewUrlParams => {
  return multiviewUrlParamsSchema.parse(params);
};

// Default preset layouts
export const defaultPresets: PresetLayout[] = [
  {
    id: "grid-2x2-default",
    name: "2x2 Grid",
    description: "Four videos in a 2x2 grid layout",
    layout: "grid-2x2",
    videoPanelTemplates: [
      {
        position: { x: 0, y: 0, width: 50, height: 50, zIndex: 0 },
        defaultVolume: 0.7,
        defaultMuted: false,
        showChat: false,
      },
      {
        position: { x: 50, y: 0, width: 50, height: 50, zIndex: 0 },
        defaultVolume: 0.3,
        defaultMuted: true,
        showChat: false,
      },
      {
        position: { x: 0, y: 50, width: 50, height: 50, zIndex: 0 },
        defaultVolume: 0.3,
        defaultMuted: true,
        showChat: false,
      },
      {
        position: { x: 50, y: 50, width: 50, height: 50, zIndex: 0 },
        defaultVolume: 0.3,
        defaultMuted: true,
        showChat: false,
      },
    ],
    chatPanelTemplates: [],
    maxVideos: 4,
    category: "general",
  },
  {
    id: "side-by-side-default",
    name: "Side by Side",
    description: "Two videos side by side",
    layout: "side-by-side",
    videoPanelTemplates: [
      {
        position: { x: 0, y: 0, width: 50, height: 100, zIndex: 0 },
        defaultVolume: 0.7,
        defaultMuted: false,
        showChat: false,
      },
      {
        position: { x: 50, y: 0, width: 50, height: 100, zIndex: 0 },
        defaultVolume: 0.3,
        defaultMuted: true,
        showChat: false,
      },
    ],
    chatPanelTemplates: [],
    maxVideos: 2,
    category: "collab",
  },
  {
    id: "picture-in-picture-default",
    name: "Picture in Picture",
    description: "Main video with smaller overlay videos",
    layout: "picture-in-picture",
    videoPanelTemplates: [
      {
        position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
        defaultVolume: 0.8,
        defaultMuted: false,
        showChat: false,
      },
      {
        position: { x: 75, y: 75, width: 24, height: 24, zIndex: 1 },
        defaultVolume: 0.2,
        defaultMuted: true,
        showChat: false,
      },
    ],
    chatPanelTemplates: [],
    maxVideos: 4,
    category: "events",
  },
  {
    id: "theater-mode-default",
    name: "Theater Mode",
    description: "Main video with chat panel",
    layout: "theater-mode",
    videoPanelTemplates: [
      {
        position: { x: 0, y: 0, width: 75, height: 100, zIndex: 0 },
        defaultVolume: 0.8,
        defaultMuted: false,
        showChat: false,
      },
    ],
    chatPanelTemplates: [
      {
        position: { x: 75, y: 0, width: 25, height: 100, zIndex: 0 },
        fontSize: "medium",
      },
    ],
    maxVideos: 1,
    category: "gaming",
  },
];

// Type guards for runtime type checking
export const isMultiviewConfig = (obj: unknown): obj is MultiviewConfig => {
  try {
    multiviewConfigSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
};

export const isVideoPanel = (obj: unknown): obj is VideoPanel => {
  try {
    videoPanelSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
};

export const isChatPanel = (obj: unknown): obj is ChatPanel => {
  try {
    chatPanelSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
};

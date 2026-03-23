import type { Livestream } from "@/features/shared/domain/livestream";

/**
 * Creates a Livestream object with sensible defaults for testing.
 * All fields can be overridden via the `overrides` parameter.
 *
 * @param overrides - Partial Livestream fields to override defaults
 * @returns A complete Livestream object
 */
export const makeLivestream = (
  overrides: Partial<Livestream> = {},
): Livestream => ({
  id: "ls-1",
  type: "livestream",
  title: "Test Stream",
  description: "",
  platform: "youtube",
  thumbnailUrl: "https://example.com/thumb.jpg",
  viewCount: 0,
  channelId: "ch-1",
  channelTitle: "Test Channel",
  channelThumbnailUrl: "https://example.com/icon.jpg",
  link: "https://example.com",
  tags: [],
  status: "live",
  scheduledStartTime: "2024-01-15T10:00:00Z",
  scheduledEndTime: null,
  ...overrides,
});

import type { Meta, StoryObj } from "@storybook/react";
import type { Livestream } from "@/features/shared/domain/livestream";
import { LivestreamCard } from "./LivestreamCard";

// Inline so stories render without any network access.
const sampleThumbnail =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0ODAiIGhlaWdodD0iMjcwIiB2aWV3Qm94PSIwIDAgNDgwIDI3MCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzViNGI4YSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMyYjZjYTMiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI0ODAiIGhlaWdodD0iMjcwIiBmaWxsPSJ1cmwoI2cpIi8+CiAgPGNpcmNsZSBjeD0iMzYwIiBjeT0iNzAiIHI9IjkwIiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjA4Ii8+CiAgPGNpcmNsZSBjeD0iOTAiIGN5PSIyMjAiIHI9IjcwIiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjA4Ii8+CiAgPHRleHQgeD0iMjQwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjM0IiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TQU1QTEU8L3RleHQ+CiAgPHRleHQgeD0iMjQwIiB5PSIxODAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjg1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj50aHVtYm5haWwgMTY6OTwvdGV4dD4KPC9zdmc+Cg==";

const baseLivestream: Livestream = {
  id: "ls-1",
  type: "livestream",
  title: "APEX Legends Ranked",
  description: "",
  platform: "youtube",
  thumbnailUrl: sampleThumbnail,
  viewCount: 1500,
  channelId: "ch-1",
  channelTitle: "Test Channel",
  channelThumbnailUrl: "/icon-top.png",
  link: "https://example.com",
  tags: [],
  status: "live",
  scheduledStartTime: "2024-01-15T10:00:00Z",
  scheduledEndTime: null,
};

const meta = {
  title: "Schedule/LivestreamCard",
  component: LivestreamCard,
} satisfies Meta<typeof LivestreamCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {
  args: {
    livestream: baseLivestream,
    isFreechat: false,
    timeZone: "Asia/Tokyo",
  },
};

export const Upcoming: Story = {
  args: {
    livestream: { ...baseLivestream, status: "upcoming" },
    isFreechat: false,
    timeZone: "Asia/Tokyo",
  },
};

export const Ended: Story = {
  args: {
    livestream: { ...baseLivestream, status: "ended" },
    isFreechat: false,
    timeZone: "Asia/Tokyo",
  },
};

export const WithAdditionalMembers: Story = {
  args: {
    livestream: baseLivestream,
    isFreechat: false,
    timeZone: "Asia/Tokyo",
    additionalMembers: [
      { name: "Member A", iconUrl: "/icon-top.png" },
      { name: "Member B", iconUrl: "/icon-top.png" },
    ],
  },
};

export const Freechat: Story = {
  args: {
    livestream: { ...baseLivestream, status: "upcoming" },
    isFreechat: true,
  },
};

export const NoThumbnail: Story = {
  args: {
    livestream: { ...baseLivestream, channelThumbnailUrl: "" },
    isFreechat: false,
    timeZone: "Asia/Tokyo",
  },
};

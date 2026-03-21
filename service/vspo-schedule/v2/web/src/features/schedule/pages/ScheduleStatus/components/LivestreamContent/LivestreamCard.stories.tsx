import type { Meta, StoryObj } from "@storybook/react";
import type { Livestream } from "@/features/shared/domain/livestream";
import { LivestreamCard } from "./LivestreamCard";

const baseLivestream: Livestream = {
  id: "ls-1",
  type: "livestream",
  title: "APEX Legends Ranked",
  description: "",
  platform: "youtube",
  thumbnailUrl: "https://via.placeholder.com/480x270",
  viewCount: 1500,
  channelId: "ch-1",
  channelTitle: "Test Channel",
  channelThumbnailUrl: "https://via.placeholder.com/36",
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

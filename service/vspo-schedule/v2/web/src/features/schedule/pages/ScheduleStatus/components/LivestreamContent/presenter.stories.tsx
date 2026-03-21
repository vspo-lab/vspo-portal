import type { Meta, StoryObj } from "@storybook/react";
import type { Livestream } from "@/features/shared/domain/livestream";
import { LivestreamContentPresenter } from "./presenter";

const baseLivestream: Livestream = {
  id: "ls-1",
  type: "livestream",
  title: "APEX Legends Ranked",
  description: "",
  platform: "youtube",
  thumbnailUrl: "https://via.placeholder.com/480x270",
  viewCount: 1500,
  channelId: "ch-1",
  channelTitle: "Ichinose Uruha",
  channelThumbnailUrl: "https://via.placeholder.com/36",
  link: "https://example.com",
  tags: [],
  status: "live",
  scheduledStartTime: "2024-01-15T10:00:00Z",
  scheduledEndTime: null,
};

const meta = {
  title: "Schedule/LivestreamContentPresenter",
  component: LivestreamContentPresenter,
} satisfies Meta<typeof LivestreamContentPresenter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    livestreamsByDate: {},
    timeZone: "Asia/Tokyo",
  },
};

export const WithStreams: Story = {
  args: {
    livestreamsByDate: {
      "2024-01-15": [
        baseLivestream,
        { ...baseLivestream, id: "ls-2", title: "Valorant Ranked", scheduledStartTime: "2024-01-15T14:00:00Z" },
      ],
    },
    timeZone: "Asia/Tokyo",
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import { EventsContentPresenter } from "./presenter";

const meta = {
  title: "Schedule/EventsContentPresenter",
  component: EventsContentPresenter,
} satisfies Meta<typeof EventsContentPresenter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { events: [] },
};

export const SingleEvent: Story = {
  args: {
    events: [
      {
        id: "evt-1",
        type: "event",
        title: "V-Spo Cup 2024",
        startedDate: "2024-01-15",
        contentSummary: null,
      },
    ],
  },
};

export const WithEvents: Story = {
  args: {
    events: [
      {
        id: "evt-1",
        type: "event",
        title: "V-Spo Cup 2024",
        startedDate: "2024-01-15",
        contentSummary: null,
      },
      {
        id: "evt-2",
        type: "event",
        title: "Birthday Stream",
        startedDate: "2024-01-16",
        contentSummary: null,
      },
    ],
  },
};

export const ManyEvents: Story = {
  args: {
    events: [
      {
        id: "evt-1",
        type: "event",
        title: "V-Spo Cup 2024",
        startedDate: "2024-01-15",
        contentSummary: null,
      },
      {
        id: "evt-2",
        type: "event",
        title: "Birthday Stream",
        startedDate: "2024-01-16",
        contentSummary: null,
      },
      {
        id: "evt-3",
        type: "event",
        title: "Collab Event",
        startedDate: "2024-01-17",
        contentSummary: null,
      },
      {
        id: "evt-4",
        type: "event",
        title: "Tournament Finals",
        startedDate: "2024-01-18",
        contentSummary: null,
      },
      {
        id: "evt-5",
        type: "event",
        title: "Anniversary Celebration",
        startedDate: "2024-01-19",
        contentSummary: null,
      },
    ],
  },
};

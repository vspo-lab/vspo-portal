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

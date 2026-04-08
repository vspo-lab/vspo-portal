import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ScheduleStatusPresenter } from "./presenter";

const meta = {
  title: "Schedule/ScheduleStatusPresenter",
  component: ScheduleStatusPresenter,
  args: {
    onStatusFilterChange: fn(),
    onSearchDialogOpen: fn(),
    onSearchDialogClose: fn(),
  },
} satisfies Meta<typeof ScheduleStatusPresenter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    livestreamsByDate: {},
    events: [],
    timeZone: "Asia/Tokyo",
    statusFilter: "all",
    isLoading: false,
    isSearchDialogOpen: false,
    allTabLabel: "All",
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

export const ArchivePage: Story = {
  args: {
    ...Default.args,
    isArchivePage: true,
  },
};

export const LiveFilter: Story = {
  args: {
    ...Default.args,
    statusFilter: "live",
  },
};

export const UpcomingTab: Story = {
  args: {
    ...Default.args,
    statusFilter: "upcoming",
  },
};

export const WithEvents: Story = {
  args: {
    ...Default.args,
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

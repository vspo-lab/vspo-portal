import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { DateSearchDialog } from "./DateSearchDialog";

const meta = {
  title: "Schedule/DateSearchDialog",
  component: DateSearchDialog,
  args: {
    onClose: fn(),
    onDateInputChange: fn(),
    onMemberTypeChange: fn(),
    onPlatformChange: fn(),
    onSubmit: fn(),
    onClear: fn(),
    onSaveFavorite: fn(),
    onLoadFavorite: fn(),
    onDeleteFavorite: fn(),
  },
} satisfies Meta<typeof DateSearchDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    dateInputValue: "2024-01-15",
    formData: {
      selectedDate: new Date("2024-01-15"),
      memberType: "vspo_all",
      platform: "",
    },
    isSearchEnabled: true,
    favorite: null,
    hasFavorite: false,
    isSaveEnabled: true,
  },
};

export const SearchDisabled: Story = {
  args: {
    ...Default.args,
    isSearchEnabled: false,
  },
};

export const WithFavorite: Story = {
  args: {
    ...Default.args,
    hasFavorite: true,
    favorite: {
      memberType: "vspo_jp",
      platform: "youtube",
      createdAt: "2024-01-10",
    },
  },
};

export const WithFavoriteJP: Story = {
  args: {
    ...Default.args,
    hasFavorite: true,
    favorite: {
      memberType: "vspo_jp",
      platform: "youtube",
      createdAt: "2024-01-10",
    },
  },
};

export const WithFavoriteAllMembers: Story = {
  args: {
    ...Default.args,
    hasFavorite: true,
    favorite: {
      memberType: "vspo_all",
      platform: "",
      createdAt: "2024-01-10",
    },
  },
};

export const SearchEnabled: Story = {
  args: {
    ...Default.args,
    isSearchEnabled: true,
    dateInputValue: "2024-06-15",
    formData: {
      selectedDate: new Date("2024-06-15"),
      memberType: "vspo_jp",
      platform: "youtube",
    },
  },
};

export const Closed: Story = {
  args: {
    ...Default.args,
    open: false,
  },
};

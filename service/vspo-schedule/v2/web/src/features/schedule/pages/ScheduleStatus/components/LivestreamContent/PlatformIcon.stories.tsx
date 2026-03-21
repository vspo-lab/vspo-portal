import type { Meta, StoryObj } from "@storybook/react";
import { PlatformIcon } from "./PlatformIcon";

const meta = {
  title: "Schedule/PlatformIcon",
  component: PlatformIcon,
} satisfies Meta<typeof PlatformIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Youtube: Story = {
  args: { platform: "youtube" },
};

export const Twitch: Story = {
  args: { platform: "twitch" },
};

export const Twitcasting: Story = {
  args: { platform: "twitcasting" },
};

export const Niconico: Story = {
  args: { platform: "niconico" },
};

export const Unknown: Story = {
  args: { platform: "unknown" },
};

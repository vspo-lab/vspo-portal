import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  addons: [],
  typescript: {
    reactDocgen: false,
  },
  refs: {
    "bot-dashboard": {
      title: "Bot Dashboard",
      url: process.env.STORYBOOK_BOT_DASHBOARD_URL || "http://localhost:6007",
    },
  },
};

export default config;

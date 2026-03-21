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
};

export default config;

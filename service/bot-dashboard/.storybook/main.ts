import type { StorybookConfig } from "@storybook/html-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.ts"],
  framework: {
    name: "@storybook/html-vite",
    options: {},
  },
  addons: [],
  viteFinal: (config) => {
    // Include Tailwind CSS plugin
    return config;
  },
};

export default config;

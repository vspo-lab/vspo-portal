import "../src/app.css";

import type { Preview } from "@storybook/html";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#121212" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
  decorators: [
    (story) => {
      const wrapper = document.createElement("div");
      wrapper.className = "font-sans text-foreground";
      const result = story();
      if (typeof result === "string") {
        wrapper.innerHTML = result;
      } else {
        wrapper.appendChild(result);
      }
      return wrapper;
    },
  ],
};

export default preview;

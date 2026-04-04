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
    (story, context) => {
      const wrapper = document.createElement("div");
      const isDark = context.globals?.backgrounds?.value !== "#ffffff";
      wrapper.className = `${isDark ? "dark" : ""} font-sans text-foreground`;
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

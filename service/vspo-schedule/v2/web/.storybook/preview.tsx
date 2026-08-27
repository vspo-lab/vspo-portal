import type { Preview } from "@storybook/react";
import { NextIntlClientProvider } from "next-intl";
import common from "../public/locales/ja/common.json";
import schedule from "../public/locales/ja/schedule.json";
import streams from "../public/locales/ja/streams.json";
import { ThemeModeProvider } from "../src/context/Theme";
import { VideoModalContext } from "../src/context/VideoModalContext";

const messages = { common, schedule, streams };

// Stories render cards in isolation, so the modal itself is not mounted.
const videoModalContextValue = {
  activeVideo: undefined,
  pushVideo: () => {},
  popVideo: () => {},
  clearVideos: () => {},
};

const preview: Preview = {
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="ja" messages={messages}>
        <ThemeModeProvider>
          <VideoModalContext.Provider value={videoModalContextValue}>
            <Story />
          </VideoModalContext.Provider>
        </ThemeModeProvider>
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;

import type { Preview } from "@storybook/react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeModeProvider } from "../src/context/Theme";

const messages = {
  streams: {
    status: {
      live: "配信中",
      upcoming: "配信予定",
    },
    events: "イベント",
  },
  schedule: {
    tabs: {
      all: "すべて",
      allWithDate: "すべて ({{date}}~)",
    },
    navigation: {
      previousDay: "前日",
      nextDay: "翌日",
    },
    noLivestreams: "配信はありません",
    search: {
      dateSearch: "日付検索",
    },
  },
};

const preview: Preview = {
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="ja" messages={messages}>
        <ThemeModeProvider>
          <Story />
        </ThemeModeProvider>
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;

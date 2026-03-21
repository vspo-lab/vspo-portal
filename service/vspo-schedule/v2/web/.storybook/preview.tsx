import type { Preview } from "@storybook/react";
import i18n from "i18next";
import { I18nextProvider } from "react-i18next";
import { ThemeModeProvider } from "../src/context/Theme";

const i18nInstance = i18n.createInstance();
i18nInstance.init({
  lng: "ja",
  fallbackLng: "ja",
  ns: ["common", "streams", "schedule"],
  defaultNS: "common",
  initImmediate: false,
  resources: {
    ja: {
      streams: {
        "status.live": "配信中",
        "status.upcoming": "配信予定",
        events: "イベント",
        "search.dateSearch": "日付検索",
      },
      schedule: {
        "tabs.all": "すべて",
        "tabs.allWithDate": "すべて ({{date}}~)",
        "navigation.previousDay": "前日",
        "navigation.nextDay": "翌日",
        noLivestreams: "配信はありません",
      },
    },
  },
  interpolation: { escapeValue: false },
});

const preview: Preview = {
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18nInstance}>
        <ThemeModeProvider>
          <Story />
        </ThemeModeProvider>
      </I18nextProvider>
    ),
  ],
};

export default preview;

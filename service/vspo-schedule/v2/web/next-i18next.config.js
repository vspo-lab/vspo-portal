// i18next.config.js
import path from "path";

const config = {
  i18n: {
    defaultLocale: "default",
    locales: ["default", "en", "ja", "cn", "tw", "ko"],
    localeDetection: false,
  },
  localePath: typeof window === 'undefined'? path.resolve("./public/locales"): "/locales",
  reloadOnPrerender: process.env.NODE_ENV === "development",
};

export default config;

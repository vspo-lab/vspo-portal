import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ja", "cn", "tw", "ko"],
  defaultLocale: "ja",
  localePrefix: "as-needed",
});

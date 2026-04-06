import { ja } from "./locales/ja";
import { en } from "./locales/en";

export type Locale = "ja" | "en";
export type TranslationKey = keyof typeof ja;
type MemberTypeKey = Extract<TranslationKey, `memberType.${string}`>;

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  ja,
  en,
};

/**
 * Translate a key to the given locale, with optional interpolation.
 * @example t("ja", "dashboard.channelsEnabled", { enabled: "3", total: "5" })
 */
export const t = (
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string>,
): string => {
  let value = dictionaries[locale][key] ?? dictionaries.ja[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replaceAll(`{${k}}`, v);
    }
  }
  return value;
};

/** Type-safe key for member type translation lookup */
const memberTypeKeys = {
  vspo_jp: "memberType.vspo_jp",
  vspo_en: "memberType.vspo_en",
  all: "memberType.all",
  custom: "memberType.custom",
} as const satisfies Record<
  import("~/features/channel/domain/member-type").MemberTypeValue,
  MemberTypeKey
>;

export const memberTypeKey = (
  value: import("~/features/channel/domain/member-type").MemberTypeValue,
): MemberTypeKey => memberTypeKeys[value];

/** Type-safe key for member type description lookup */
type MemberTypeDescKey = Extract<TranslationKey, `memberType.${string}.desc`>;

const memberTypeDescKeys = {
  vspo_jp: "memberType.vspo_jp.desc",
  vspo_en: "memberType.vspo_en.desc",
  all: "memberType.all.desc",
  custom: "memberType.custom.desc",
} as const satisfies Record<
  import("~/features/channel/domain/member-type").MemberTypeValue,
  MemberTypeDescKey
>;

export const memberTypeDescKey = (
  value: import("~/features/channel/domain/member-type").MemberTypeValue,
): MemberTypeDescKey => memberTypeDescKeys[value];

const languageDisplayKeys: Record<string, TranslationKey> = {
  ja: "channelConfig.language.ja",
  en: "channelConfig.language.en",
  fr: "channelConfig.language.fr",
  de: "channelConfig.language.de",
  es: "channelConfig.language.es",
  cn: "channelConfig.language.cn",
  tw: "channelConfig.language.tw",
  ko: "channelConfig.language.ko",
  default: "channelConfig.language.default",
};

/** Map a language code to its translation key, falling back to "unknown". */
export const languageDisplayKey = (langCode: string): TranslationKey =>
  languageDisplayKeys[langCode] ?? "channelConfig.language.unknown";

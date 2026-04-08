import { languageDisplayKey, memberTypeKey, t } from "./dict";

describe("t (translation)", () => {
  it.each([
    ["ja", "app.name", "すぽじゅーる Bot"],
    ["en", "app.name", "Spodule Bot"],
    ["ja", "login.title", "ログイン"],
    ["en", "dashboard.installed", "Bot Installed"],
    ["ja", "dashboard.installed", "Bot 導入済み"],
  ] as const)("t(%s, %s) → %s", (locale, key, expected) => {
    expect(t(locale, key)).toBe(expected);
  });

  it("interpolates params", () => {
    const result = t("en", "dashboard.channelsCount", {
      total: "5",
    });
    expect(result).toBe("5 channels configured");
  });

  it("interpolates multiple params in ja", () => {
    const result = t("ja", "dashboard.channelsCount", {
      total: "10",
    });
    expect(result).toBe("10 チャンネル設定済み");
  });

  it("interpolates channelName param", () => {
    const result = t("en", "channelConfig.title", {
      channelName: "general",
    });
    expect(result).toBe("#general Settings");
  });

  it("returns key as fallback for unknown key", () => {
    // Use type assertion for testing unknown key behavior
    const result = t("en", "nonexistent.key" as Parameters<typeof t>[1]);
    // If key doesn't exist in either dict, falls back to key itself
    expect(result).toBe("nonexistent.key");
  });
});

describe("landing page & UI keys", () => {
  it.each([
    "login.addBot",
    "login.previewCaption",
    "login.previewAlt1",
    "login.previewAlt2",
    "footer.poweredBy",
    "footer.schedule",
    "footer.terms",
    "footer.privacy",
    "login.features.desc",
    "login.cta.headline",
    "login.cta.description",
    "login.feature.settings",
    "login.feature.settings.desc",
    "dashboard.stat.channels",
    "channel.add",
    "channel.add.search",
    "channel.add.registered",
    "channel.add.empty",
    "channel.add.submit",
    "channelConfig.language.unknown",
    "channelConfig.language.fr",
    "channelConfig.language.de",
    "channelConfig.language.es",
    "channelConfig.language.cn",
    "channelConfig.language.tw",
    "channelConfig.language.ko",
    "channelConfig.language.default",
    "channelConfig.reset",
    "channelConfig.reset.confirm",
    "toast.resetSuccess",
    "channelConfig.members.search",
    "channelConfig.members.selectAll",
    "channelConfig.members.deselectAll",
    "channelConfig.members.selected",
    "channelConfig.members.jpGroup",
    "channelConfig.members.enGroup",
    "error.notFound.title",
    "error.notFound.back",
  ] as const)("key '%s' exists in both locales", (key) => {
    expect(t("ja", key)).not.toBe(key);
    expect(t("en", key)).not.toBe(key);
  });
});

describe("redesign keys", () => {
  it.each([
    "nav.channels",
    "nav.notifications",
    "nav.announcements",
    "nav.comingSoon",
    "announcements.title",
    "announcements.empty",
    "announcements.type.info",
    "announcements.type.update",
    "announcements.type.maintenance",
    "channel.status",
    "channel.status.active",
    "channel.status.paused",
    "meta.login.description",
    "meta.dashboard.description",
    "meta.guildDetail.description",
    "memberType.vspo_jp.desc",
    "memberType.vspo_en.desc",
    "memberType.all.desc",
    "memberType.custom.desc",
  ] as const)("key '%s' exists in both locales", (key) => {
    expect(t("ja", key)).not.toBe(key);
    expect(t("en", key)).not.toBe(key);
  });
});

describe("languageDisplayKey", () => {
  it.each([
    { langCode: "ja", expectedKey: "channelConfig.language.ja" },
    { langCode: "en", expectedKey: "channelConfig.language.en" },
    { langCode: "fr", expectedKey: "channelConfig.language.fr" },
    { langCode: "de", expectedKey: "channelConfig.language.de" },
    { langCode: "es", expectedKey: "channelConfig.language.es" },
    { langCode: "cn", expectedKey: "channelConfig.language.cn" },
    { langCode: "tw", expectedKey: "channelConfig.language.tw" },
    { langCode: "ko", expectedKey: "channelConfig.language.ko" },
    { langCode: "default", expectedKey: "channelConfig.language.default" },
    { langCode: "", expectedKey: "channelConfig.language.unknown" },
  ])("maps $langCode to $expectedKey", ({ langCode, expectedKey }) => {
    expect(languageDisplayKey(langCode)).toBe(expectedKey);
  });
});

describe("memberTypeKey", () => {
  it.each([
    ["vspo_jp", "memberType.vspo_jp"],
    ["vspo_en", "memberType.vspo_en"],
    ["all", "memberType.all"],
    ["custom", "memberType.custom"],
  ] as const)("memberTypeKey(%s) → %s", (value, expected) => {
    expect(memberTypeKey(value)).toBe(expected);
  });
});

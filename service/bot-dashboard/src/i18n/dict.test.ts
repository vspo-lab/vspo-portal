import { languageDisplayKey, memberTypeKey, t } from "./dict";

describe("t (translation)", () => {
  it.each([
    ["ja", "app.name", "Spodule Bot"],
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

describe("new landing page keys", () => {
  it.each([
    "login.addBot",
    "login.manageSettings",
    "login.previewCaption",
    "channel.add",
    "channel.add.search",
    "channel.add.registered",
    "channel.add.empty",
    "channel.add.submit",
    "channelConfig.language.unknown",
  ] as const)("key '%s' exists in both locales", (key) => {
    expect(t("ja", key)).not.toBe(key);
    expect(t("en", key)).not.toBe(key);
  });
});

describe("languageDisplayKey", () => {
  it.each([
    { langCode: "ja", expectedKey: "channelConfig.language.ja" },
    { langCode: "en", expectedKey: "channelConfig.language.en" },
    { langCode: "fr", expectedKey: "channelConfig.language.unknown" },
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

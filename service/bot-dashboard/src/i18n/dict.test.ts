import { memberTypeKey, t } from "./dict";

describe("t (translation)", () => {
  it.each([
    ["ja", "app.name", "Spodule Bot"],
    ["en", "app.name", "Spodule Bot"],
    ["ja", "login.title", "ログイン"],
    ["en", "guild.active", "Active"],
    ["ja", "guild.active", "導入済み"],
  ] as const)("t(%s, %s) → %s", (locale, key, expected) => {
    expect(t(locale, key)).toBe(expected);
  });

  it("interpolates params", () => {
    const result = t("en", "dashboard.channelsEnabled", {
      enabled: "3",
      total: "5",
    });
    expect(result).toBe("3/5 channels enabled");
  });

  it("interpolates multiple params in ja", () => {
    const result = t("ja", "dashboard.channelsEnabled", {
      enabled: "2",
      total: "10",
    });
    expect(result).toBe("2/10 チャンネル有効");
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

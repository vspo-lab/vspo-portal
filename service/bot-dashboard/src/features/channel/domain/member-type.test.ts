import { MemberType } from "./member-type";

describe("MemberType", () => {
  describe("schema", () => {
    it.each([
      "vspo_jp",
      "vspo_en",
      "all",
      "custom",
    ] as const)("accepts valid value: %s", (value) => {
      expect(MemberType.schema.parse(value)).toBe(value);
    });

    it.each([
      "invalid",
      "",
      "VSPO_JP",
      "jp",
      null,
      undefined,
      42,
    ])("rejects invalid value: %s", (value) => {
      expect(() => MemberType.schema.parse(value)).toThrow();
    });
  });

  describe("requiresCustomSelection", () => {
    it.each([
      ["vspo_jp" as const, false],
      ["vspo_en" as const, false],
      ["all" as const, false],
      ["custom" as const, true],
    ])("for %s returns %s", (value, expected) => {
      expect(MemberType.requiresCustomSelection(value)).toBe(expected);
    });
  });
});

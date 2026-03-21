import { describe, expect, it } from "vitest";
import { ChannelConfig } from "./channel-config";

describe("ChannelConfig", () => {
  describe("schema", () => {
    it.each([
      {
        name: "valid config with all fields",
        input: {
          channelId: "ch-1",
          channelName: "general",
          enabled: true,
          language: "ja",
          memberType: "all",
          customMembers: ["m1", "m2"],
        },
        valid: true,
      },
      {
        name: "valid config without optional customMembers",
        input: {
          channelId: "ch-1",
          channelName: "general",
          enabled: false,
          language: "en",
          memberType: "vspo_jp",
        },
        valid: true,
      },
      {
        name: "invalid: missing channelId",
        input: {
          channelName: "general",
          enabled: true,
          language: "ja",
          memberType: "all",
        },
        valid: false,
      },
      {
        name: "invalid: wrong memberType",
        input: {
          channelId: "ch-1",
          channelName: "general",
          enabled: true,
          language: "ja",
          memberType: "invalid",
        },
        valid: false,
      },
      {
        name: "invalid: enabled is not boolean",
        input: {
          channelId: "ch-1",
          channelName: "general",
          enabled: "yes",
          language: "ja",
          memberType: "all",
        },
        valid: false,
      },
    ])("$name", ({ input, valid }) => {
      const result = ChannelConfig.schema.safeParse(input);
      expect(result.success).toBe(valid);
    });
  });
});

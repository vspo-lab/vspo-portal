import { beforeEach, describe, expect, it } from "vitest";
import type { ChannelConfigType } from "../../domain/channel-config";
import {
  $channels,
  initChannels,
  optimisticAdd,
  optimisticRemove,
  optimisticUpdate,
} from "../channel-data";

const ch1: ChannelConfigType = {
  channelId: "ch1",
  channelName: "general",
  enabled: true,
  language: "ja",
  memberType: "all",
};

const ch2: ChannelConfigType = {
  channelId: "ch2",
  channelName: "announcements",
  enabled: true,
  language: "en",
  memberType: "vspo_jp",
};

describe("channel-data store", () => {
  beforeEach(() => {
    $channels.set([]);
  });

  it("initializes with server data", () => {
    initChannels([ch1, ch2]);
    expect($channels.get()).toEqual([ch1, ch2]);
  });

  it("optimistically adds a channel", () => {
    initChannels([ch1]);
    optimisticAdd(ch2);
    expect($channels.get()).toEqual([ch1, ch2]);
  });

  it("rollback restores previous state after add", () => {
    initChannels([ch1]);
    const rollback = optimisticAdd(ch2);
    rollback();
    expect($channels.get()).toEqual([ch1]);
  });

  it("optimistically updates a channel", () => {
    initChannels([ch1, ch2]);
    optimisticUpdate("ch1", { language: "en" });
    expect($channels.get()[0].language).toBe("en");
    expect($channels.get()[1]).toEqual(ch2);
  });

  it("rollback restores previous state after update", () => {
    initChannels([ch1]);
    const rollback = optimisticUpdate("ch1", { language: "en" });
    rollback();
    expect($channels.get()[0].language).toBe("ja");
  });

  it("optimistically removes a channel", () => {
    initChannels([ch1, ch2]);
    optimisticRemove("ch1");
    expect($channels.get()).toEqual([ch2]);
  });

  it("rollback restores previous state after remove", () => {
    initChannels([ch1, ch2]);
    const rollback = optimisticRemove("ch1");
    rollback();
    expect($channels.get()).toEqual([ch1, ch2]);
  });
});

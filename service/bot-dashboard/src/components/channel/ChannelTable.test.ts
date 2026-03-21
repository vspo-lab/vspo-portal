import { getAllByRole, getByRole, getByText } from "@testing-library/dom";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { ChannelConfigType } from "~/features/channel/domain/channel-config";
import ChannelTable from "./ChannelTable.astro";

vi.mock("astro:actions", () => ({
  actions: {
    toggleChannel: "/api/toggle",
    updateChannel: "/api/update",
  },
}));

const parseHtml = (html: string) =>
  new DOMParser().parseFromString(html, "text/html").body;

describe("ChannelTable", () => {
  let container: AstroContainer;

  beforeEach(async () => {
    container = await AstroContainer.create();
  });

  const channels: ChannelConfigType[] = [
    {
      channelId: "ch-1",
      channelName: "general",
      enabled: true,
      language: "ja",
      memberType: "all",
    },
    {
      channelId: "ch-2",
      channelName: "notifications",
      enabled: false,
      language: "en",
      memberType: "vspo_jp",
    },
  ];

  it("renders channel names with # prefix", async () => {
    const html = await container.renderToString(ChannelTable, {
      props: { channels, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(getByText(body, "#general")).toBeTruthy();
    expect(getByText(body, "#notifications")).toBeTruthy();
  });

  it("renders toggle switches with correct aria-checked", async () => {
    const html = await container.renderToString(ChannelTable, {
      props: { channels, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const switches = getAllByRole(body, "switch");
    expect(switches).toHaveLength(2);
    expect(switches[0].getAttribute("aria-checked")).toBe("true");
    expect(switches[1].getAttribute("aria-checked")).toBe("false");
  });

  it("shows empty message when channels is empty", async () => {
    const html = await container.renderToString(ChannelTable, {
      props: { channels: [], guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(getByText(body, "No channels configured.")).toBeTruthy();
  });

  it("renders edit links for each channel", async () => {
    const html = await container.renderToString(ChannelTable, {
      props: { channels, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const editLinks = getAllByRole(body, "link");
    const editHrefs = editLinks.map((l) => l.getAttribute("href"));
    expect(editHrefs).toContain("?edit=ch-1");
    expect(editHrefs).toContain("?edit=ch-2");
  });

  it("renders table with accessible label", async () => {
    const html = await container.renderToString(ChannelTable, {
      props: { channels, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const table = getByRole(body, "table");
    expect(table.getAttribute("aria-label")).toBe("Channel settings");
  });
});

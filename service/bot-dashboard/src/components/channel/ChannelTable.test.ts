import { getAllByRole, getByRole, getByText } from "@testing-library/dom";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { ChannelConfigType } from "~/features/channel/domain/channel-config";
import ChannelTable from "./ChannelTable.astro";

vi.mock("astro:actions", () => ({
  actions: {
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

  it("renders channel names", async () => {
    const html = await container.renderToString(ChannelTable, {
      props: { channels, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(getByText(body, "general")).toBeTruthy();
    expect(getByText(body, "notifications")).toBeTruthy();
  });

  it("shows empty message when channels is empty", async () => {
    const html = await container.renderToString(ChannelTable, {
      props: { channels: [], guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(getByText(body, "No channels configured.")).toBeTruthy();
  });

  it("renders edit buttons for each channel", async () => {
    const html = await container.renderToString(ChannelTable, {
      props: { channels, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const editButtons = getAllByRole(body, "button").filter(
      (btn) => btn.getAttribute("data-action-edit") !== null,
    );
    const editIds = editButtons.map((btn) =>
      btn.getAttribute("data-action-edit"),
    );
    expect(editIds).toContain("ch-1");
    expect(editIds).toContain("ch-2");
  });

  it("shows Active status for enabled channels", async () => {
    const html = await container.renderToString(ChannelTable, {
      props: { channels, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(body.textContent).toContain("Active");
  });

  it("shows Paused status for disabled channels", async () => {
    const html = await container.renderToString(ChannelTable, {
      props: { channels, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(body.textContent).toContain("Paused");
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

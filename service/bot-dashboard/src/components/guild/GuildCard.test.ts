import { getByRole, getByText } from "@testing-library/dom";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { GuildSummaryType } from "~/features/guild/domain/guild";
import GuildCard from "./GuildCard.astro";

const parseHtml = (html: string) =>
  new DOMParser().parseFromString(html, "text/html").body;

describe("GuildCard", () => {
  let container: AstroContainer;

  beforeEach(async () => {
    container = await AstroContainer.create();
  });

  const installedGuild: GuildSummaryType = {
    id: "guild-123",
    name: "My Awesome Server",
    icon: "icon_hash",
    isAdmin: true,
    botInstalled: true,
    channelSummary: {
      enabledCount: 2,
      totalCount: 3,
      previewNames: ["general", "notifications"],
    },
  };

  const notInstalledGuild: GuildSummaryType = {
    id: "guild-456",
    name: "Other Server",
    icon: null,
    isAdmin: true,
    botInstalled: false,
  };

  const botClientId = "bot-client-id-999";

  it("displays guild name", async () => {
    const html = await container.renderToString(GuildCard, {
      props: { guild: installedGuild, botClientId },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(getByText(body, "My Awesome Server")).toBeTruthy();
  });

  it("shows 'Manage Settings' link when bot is installed", async () => {
    const html = await container.renderToString(GuildCard, {
      props: { guild: installedGuild, botClientId },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const link = getByRole(body, "link", { name: /Manage Settings/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/dashboard/guild-123");
  });

  it("shows 'Add Bot' link when bot is not installed", async () => {
    const html = await container.renderToString(GuildCard, {
      props: { guild: notInstalledGuild, botClientId },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const link = getByRole(body, "link", { name: /Add Bot/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toContain("discord.com/oauth2/authorize");
    expect(link.getAttribute("href")).toContain("bot-client-id-999");
    expect(link.getAttribute("href")).toContain("guild-456");
  });

  it("shows 'Bot Installed' badge when bot is installed (en locale)", async () => {
    const html = await container.renderToString(GuildCard, {
      props: { guild: installedGuild, botClientId },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(getByText(body, /Bot Installed/)).toBeTruthy();
  });

  it("shows 'Bot 導入済み' badge when bot is installed (ja locale)", async () => {
    const html = await container.renderToString(GuildCard, {
      props: { guild: installedGuild, botClientId },
      locals: { locale: "ja" },
    });
    const body = parseHtml(html);
    expect(getByText(body, /Bot 導入済み/)).toBeTruthy();
  });

  it("shows channel summary when bot is installed with channelSummary", async () => {
    const html = await container.renderToString(GuildCard, {
      props: { guild: installedGuild, botClientId },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    // en locale: dashboard.channelsCount = "{total} channels configured"
    expect(body.textContent).toContain("3 channels configured");
    expect(getByText(body, "#general")).toBeTruthy();
    expect(getByText(body, "#notifications")).toBeTruthy();
  });

  it("does not show channel summary when bot is not installed", async () => {
    const html = await container.renderToString(GuildCard, {
      props: { guild: notInstalledGuild, botClientId },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(body.textContent).not.toContain("channels configured");
  });

  it("does not show active badge when bot is not installed", async () => {
    const html = await container.renderToString(GuildCard, {
      props: { guild: notInstalledGuild, botClientId },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(body.textContent).not.toContain("Bot Installed");
  });
});

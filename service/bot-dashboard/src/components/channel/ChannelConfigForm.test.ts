import {
  getAllByRole,
  getByLabelText,
  getByRole,
  getByText,
  queryByText,
} from "@testing-library/dom";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { ChannelConfigType } from "~/features/channel/domain/channel-config";
import type { CreatorType } from "~/features/shared/domain/creator";
import ChannelConfigForm from "./ChannelConfigForm.astro";

vi.mock("astro:actions", () => ({
  actions: {
    toggleChannel: "/api/toggle",
    updateChannel: "/api/update",
  },
}));

const parseHtml = (html: string) =>
  new DOMParser().parseFromString(html, "text/html").body;

describe("ChannelConfigForm", () => {
  let container: AstroContainer;

  beforeEach(async () => {
    container = await AstroContainer.create();
  });

  const channel: ChannelConfigType = {
    channelId: "ch-1",
    channelName: "general",
    enabled: true,
    language: "ja",
    memberType: "vspo_jp",
  };

  const customChannel: ChannelConfigType = {
    channelId: "ch-2",
    channelName: "custom-ch",
    enabled: true,
    language: "en",
    memberType: "custom",
    customMembers: ["c1"],
  };

  const creators: CreatorType[] = [
    {
      id: "c1",
      name: "Creator One",
      memberType: "vspo_jp",
      thumbnailUrl: null,
    },
    {
      id: "c2",
      name: "Creator Two",
      memberType: "vspo_en",
      thumbnailUrl: "https://example.com/c2.png",
    },
  ];

  it("displays channel name in heading", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { channel, creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    // en: channelConfig.title = "#{channelName} Settings"
    const heading = getByRole(body, "heading", { name: /#general Settings/i });
    expect(heading).toBeTruthy();
  });

  it("renders language select with correct selected option", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { channel, creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const select = getByLabelText(body, "Language") as HTMLSelectElement;
    expect(select).toBeTruthy();
    // Check that the "ja" option is selected
    const jaOption = select.querySelector(
      'option[value="ja"]',
    ) as HTMLOptionElement;
    expect(jaOption.selected).toBe(true);
  });

  it("renders 4 member type radio buttons", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { channel, creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const radios = getAllByRole(body, "radio");
    expect(radios).toHaveLength(4);
    const values = radios.map((r) => (r as HTMLInputElement).value);
    expect(values).toEqual(["vspo_jp", "vspo_en", "all", "custom"]);
  });

  it("has vspo_jp radio checked for channel with memberType=vspo_jp", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { channel, creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const radios = getAllByRole(body, "radio") as HTMLInputElement[];
    const checked = radios.find((r) => r.checked);
    expect(checked?.value).toBe("vspo_jp");
  });

  it("hides custom members section when memberType is not custom", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { channel, creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(queryByText(body, "Custom Members")).toBeNull();
  });

  it("shows custom members section when memberType is custom", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { channel: customChannel, creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(getByText(body, "Custom Members")).toBeTruthy();
    // Should show creator names
    expect(getByText(body, "Creator One")).toBeTruthy();
    expect(getByText(body, "Creator Two")).toBeTruthy();
  });

  it("pre-checks custom members that are in channel.customMembers", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { channel: customChannel, creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const checkboxes = getAllByRole(body, "checkbox") as HTMLInputElement[];
    const c1 = checkboxes.find((cb) => cb.value === "c1");
    const c2 = checkboxes.find((cb) => cb.value === "c2");
    expect(c1?.checked).toBe(true);
    expect(c2?.checked).toBe(false);
  });
});

import { getByText } from "@testing-library/dom";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { CreatorType } from "~/features/shared/domain/creator";
import ChannelConfigForm from "./ChannelConfigForm.astro";

vi.mock("astro:actions", () => ({
  actions: {
    updateChannel: "/api/update",
    resetChannel: "/api/reset",
  },
}));

const parseHtml = (html: string) =>
  new DOMParser().parseFromString(html, "text/html").body;

describe("ChannelConfigForm", () => {
  let container: AstroContainer;

  beforeEach(async () => {
    container = await AstroContainer.create();
  });

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

  it("renders dialog with heading element", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const dialog = body.querySelector("dialog#config-modal");
    expect(dialog).toBeTruthy();
    const heading = dialog?.querySelector("[data-config-heading]");
    expect(heading).toBeTruthy();
  });

  it("renders language select with all options", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const select = body.querySelector("#language") as HTMLSelectElement;
    expect(select).toBeTruthy();
    const options = select.querySelectorAll("option");
    expect(options.length).toBe(9); // ja, en, fr, de, es, cn, tw, ko, default
  });

  it("renders 4 member type radio buttons", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const radios = body.querySelectorAll('input[name="memberType"]');
    expect(radios).toHaveLength(4);
    const values = Array.from(radios).map((r) => (r as HTMLInputElement).value);
    expect(values).toEqual(["vspo_jp", "vspo_en", "all", "custom"]);
  });

  it("renders creator checkboxes for custom members", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const checkboxes = body.querySelectorAll<HTMLInputElement>(
      "[data-member-checkbox]",
    );
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0].value).toBe("c1");
    expect(checkboxes[1].value).toBe("c2");
  });

  it("renders update form with correct action", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const form = body.querySelector("#update-channel-form") as HTMLFormElement;
    expect(form).toBeTruthy();
    expect(form.getAttribute("method")).toBe("POST");
  });

  it("renders reset form with correct action", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const form = body.querySelector("#reset-channel-form") as HTMLFormElement;
    expect(form).toBeTruthy();
    expect(form.getAttribute("method")).toBe("POST");
  });

  it("includes guildId hidden input", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const guildIdInput = body.querySelector(
      'input[name="guildId"]',
    ) as HTMLInputElement;
    expect(guildIdInput).toBeTruthy();
    expect(guildIdInput.value).toBe("guild-1");
  });

  it("shows creator names in member selection", async () => {
    const html = await container.renderToString(ChannelConfigForm, {
      props: { creators, guildId: "guild-1" },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(getByText(body, "Creator One")).toBeTruthy();
    expect(getByText(body, "Creator Two")).toBeTruthy();
  });
});

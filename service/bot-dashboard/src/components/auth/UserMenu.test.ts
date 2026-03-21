import { getByRole, getByText } from "@testing-library/dom";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import UserMenu from "./UserMenu.astro";

const parseHtml = (html: string) =>
  new DOMParser().parseFromString(html, "text/html").body;

describe("UserMenu", () => {
  let container: AstroContainer;

  beforeEach(async () => {
    container = await AstroContainer.create();
  });

  it("displays the user's display name", async () => {
    const html = await container.renderToString(UserMenu, {
      props: { displayName: "Test User", avatarUrl: null },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    expect(getByText(body, "Test User")).toBeTruthy();
  });

  it("has a logout form", async () => {
    const html = await container.renderToString(UserMenu, {
      props: { displayName: "User", avatarUrl: null },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const button = getByRole(body, "button", { name: /Logout/i });
    expect(button).toBeTruthy();
    expect(button.getAttribute("type")).toBe("submit");
    // The button is inside a form with action="/auth/logout"
    const form = button.closest("form");
    expect(form?.getAttribute("action")).toBe("/auth/logout");
  });

  it("shows avatar image when avatarUrl is provided", async () => {
    const html = await container.renderToString(UserMenu, {
      props: {
        displayName: "User",
        avatarUrl: "https://cdn.discordapp.com/avatars/123/abc.png",
      },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const img = getByRole(body, "img", { name: "User" });
    expect(img.getAttribute("src")).toBe(
      "https://cdn.discordapp.com/avatars/123/abc.png",
    );
  });

  it("shows initial when avatarUrl is null", async () => {
    const html = await container.renderToString(UserMenu, {
      props: { displayName: "Zach", avatarUrl: null },
      locals: { locale: "en" },
    });
    const body = parseHtml(html);
    const avatar = getByRole(body, "img", { name: "Zach" });
    expect(avatar.textContent).toBe("Z");
  });
});

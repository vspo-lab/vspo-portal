import { getByRole } from "@testing-library/dom";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import AvatarFallback from "./AvatarFallback.astro";

const parseHtml = (html: string) =>
  new DOMParser().parseFromString(html, "text/html").body;

describe("AvatarFallback", () => {
  let container: AstroContainer;

  beforeEach(async () => {
    container = await AstroContainer.create();
  });

  it("renders img when src is provided", async () => {
    const html = await container.renderToString(AvatarFallback, {
      props: {
        src: "https://example.com/avatar.png",
        name: "Alice",
        size: "md",
      },
    });
    const body = parseHtml(html);
    const img = getByRole(body, "img", { name: "Alice" });
    expect(img.tagName).toBe("IMG");
    expect(img.getAttribute("src")).toBe("https://example.com/avatar.png");
  });

  it("renders initial letter when src is null", async () => {
    const html = await container.renderToString(AvatarFallback, {
      props: { src: null, name: "Bob", size: "md" },
    });
    const body = parseHtml(html);
    const fallback = getByRole(body, "img", { name: "Bob" });
    expect(fallback.tagName).toBe("DIV");
    expect(fallback.textContent).toBe("B");
  });

  it.each([
    "xs",
    "sm",
    "md",
    "lg",
  ] as const)("renders without error for size=%s", async (size) => {
    const html = await container.renderToString(AvatarFallback, {
      props: { src: null, name: "Test", size },
    });
    const body = parseHtml(html);
    expect(getByRole(body, "img", { name: "Test" })).toBeTruthy();
  });
});

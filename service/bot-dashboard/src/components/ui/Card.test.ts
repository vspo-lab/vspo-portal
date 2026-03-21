import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Card from "./Card.astro";

const parseHtml = (html: string) =>
  new DOMParser().parseFromString(html, "text/html").body;

describe("Card", () => {
  it("renders with default classes", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Card, {
      slots: { default: "Card content" },
    });
    const body = parseHtml(html);
    const el = body.firstElementChild;
    expect(el?.className).toContain("rounded-");
    expect(el?.className).toContain("border");
    expect(el?.textContent).toContain("Card content");
  });

  it("appends custom class", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Card, {
      props: { class: "custom-class" },
      slots: { default: "Content" },
    });
    const body = parseHtml(html);
    expect(body.firstElementChild?.className).toContain("custom-class");
  });
});

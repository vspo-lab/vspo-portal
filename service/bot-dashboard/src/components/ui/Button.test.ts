import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Button from "./Button.astro";

const parseHtml = (html: string) =>
  new DOMParser().parseFromString(html, "text/html").body;

describe("Button", () => {
  it.each([
    { variant: "default", expectedClass: "bg-primary" },
    { variant: "outline", expectedClass: "border" },
    { variant: "ghost", expectedClass: "hover:bg-accent" },
    { variant: "discord", expectedClass: "bg-discord" },
  ] as const)("renders $variant variant with correct classes", async ({
    variant,
    expectedClass,
  }) => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Button, {
      props: { variant },
      slots: { default: "Click me" },
    });
    const body = parseHtml(html);
    const el = body.firstElementChild;
    expect(el?.className).toContain(expectedClass);
    expect(el?.textContent).toContain("Click me");
  });

  it.each([
    { size: "sm", expectedClass: "h-9" },
    { size: "lg", expectedClass: "h-11" },
    { size: "icon", expectedClass: "h-10 w-10" },
  ] as const)("renders $size size", async ({ size, expectedClass }) => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Button, {
      props: { size },
      slots: { default: "Btn" },
    });
    const body = parseHtml(html);
    expect(body.firstElementChild?.className).toContain(expectedClass);
  });

  it("renders as anchor when as='a'", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Button, {
      props: { as: "a", href: "/test" },
      slots: { default: "Link" },
    });
    const body = parseHtml(html);
    const el = body.querySelector("a");
    expect(el).toBeTruthy();
    expect(el?.getAttribute("href")).toBe("/test");
  });

  it("renders as button by default", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Button, {
      props: {},
      slots: { default: "Default" },
    });
    const body = parseHtml(html);
    expect(body.querySelector("button")).toBeTruthy();
  });
});

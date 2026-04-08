// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LanguageSelectorIsland } from "../LanguageSelectorIsland";

describe("LanguageSelectorIsland", () => {
  beforeEach(() => {
    // Reset forms
    document.forms.length;
  });

  it("renders globe icon button", () => {
    render(
      <LanguageSelectorIsland
        currentLocale="ja"
        returnTo="/dashboard"
        label="Language"
        localeLabels={{ ja: "日本語", en: "English" }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Language" }),
    ).toBeInTheDocument();
  });

  it("shows current locale badge", () => {
    render(
      <LanguageSelectorIsland
        currentLocale="ja"
        returnTo="/dashboard"
        label="Language"
        localeLabels={{ ja: "日本語", en: "English" }}
      />,
    );
    expect(screen.getByText("JA")).toBeInTheDocument();
  });

  it("opens dropdown on click", async () => {
    const user = userEvent.setup();
    render(
      <LanguageSelectorIsland
        currentLocale="ja"
        returnTo="/dashboard"
        label="Language"
        localeLabels={{ ja: "日本語", en: "English" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Language" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("日本語")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("closes dropdown on second click", async () => {
    const user = userEvent.setup();
    render(
      <LanguageSelectorIsland
        currentLocale="ja"
        returnTo="/dashboard"
        label="Language"
        localeLabels={{ ja: "日本語", en: "English" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Language" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Language" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("highlights current locale", async () => {
    const user = userEvent.setup();
    render(
      <LanguageSelectorIsland
        currentLocale="ja"
        returnTo="/dashboard"
        label="Language"
        localeLabels={{ ja: "日本語", en: "English" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Language" }));
    const jaButton = screen.getByRole("menuitem", { name: "日本語" });
    expect(jaButton.className).toContain("font-semibold");
  });
});

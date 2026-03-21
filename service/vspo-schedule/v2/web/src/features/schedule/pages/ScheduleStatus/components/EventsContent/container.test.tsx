import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeModeProvider } from "@/context/Theme";
import { EventsContentContainer } from "./container";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeModeProvider>{ui}</ThemeModeProvider>);

describe("EventsContentContainer", () => {
  it("renders presenter with events", () => {
    const events = [
      {
        id: "e1",
        type: "event",
        title: "Test Event",
        startedDate: "2024-01-01",
        contentSummary: null,
      },
    ];
    renderWithTheme(<EventsContentContainer events={events} />);
    expect(screen.getByText("Test Event")).toBeInTheDocument();
  });

  it("renders nothing when events is empty", () => {
    const { container } = renderWithTheme(
      <EventsContentContainer events={[]} />,
    );
    // EventsContentPresenter returns empty fragment for empty events
    expect(container.querySelector("[class]")).toBeNull();
  });
});

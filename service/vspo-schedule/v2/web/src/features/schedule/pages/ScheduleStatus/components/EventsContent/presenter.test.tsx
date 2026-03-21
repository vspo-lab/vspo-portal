import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeModeProvider } from "@/context/Theme";
import type { Event } from "@/features/shared/domain";
import { EventsContentPresenter } from "./presenter";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: "evt-1",
  type: "event",
  title: "Test Event",
  startedDate: "2024-01-15",
  contentSummary: null,
  isNotLink: false,
  ...overrides,
});

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeModeProvider>{ui}</ThemeModeProvider>);

describe("EventsContentPresenter", () => {
  it("renders nothing when events array is empty", () => {
    const { container } = renderWithTheme(
      <EventsContentPresenter events={[]} />,
    );
    // Empty fragment still produces an empty container child
    expect(container.querySelector("[class]")).toBeNull();
  });

  it("renders event titles in a list", () => {
    const events = [
      makeEvent({ id: "evt-1", title: "Event Alpha" }),
      makeEvent({ id: "evt-2", title: "Event Beta" }),
    ];
    renderWithTheme(<EventsContentPresenter events={events} />);
    expect(screen.getByText("Event Alpha")).toBeInTheDocument();
    expect(screen.getByText("Event Beta")).toBeInTheDocument();
  });

  it("renders the events section header", () => {
    const events = [makeEvent()];
    renderWithTheme(<EventsContentPresenter events={events} />);
    // t("events") returns "events" from our mock
    expect(screen.getByText("events")).toBeInTheDocument();
  });
});

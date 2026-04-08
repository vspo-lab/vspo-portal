import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeModeProvider } from "@/context/Theme";
import { ScheduleStatusPresenter } from "./presenter";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("./components", () => ({
  DateSearchDialogContainer: () => null,
  EventsContent: () => <div data-testid="events-content" />,
  LivestreamContent: () => <div data-testid="livestream-content" />,
}));

vi.mock("@/features/shared/components/Elements/Loading/Loading", () => ({
  Loading: () => <div data-testid="loading-spinner" />,
}));

const defaultProps = {
  livestreamsByDate: {},
  events: [],
  timeZone: "Asia/Tokyo",
  statusFilter: "all" as const,
  onStatusFilterChange: vi.fn(),
  isLoading: false,
  isSearchDialogOpen: false,
  onSearchDialogOpen: vi.fn(),
  onSearchDialogClose: vi.fn(),
  allTabLabel: "All",
};

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeModeProvider>{ui}</ThemeModeProvider>);

describe("ScheduleStatusPresenter", () => {
  it("renders tabs (all, live, upcoming)", () => {
    renderWithTheme(<ScheduleStatusPresenter {...defaultProps} />);
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "status.live" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "status.upcoming" }),
    ).toBeInTheDocument();
  });

  it("hides tabs when isArchivePage is true", () => {
    renderWithTheme(
      <ScheduleStatusPresenter {...defaultProps} isArchivePage={true} />,
    );
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("calls onStatusFilterChange on tab click", async () => {
    const onStatusFilterChange = vi.fn();
    renderWithTheme(
      <ScheduleStatusPresenter
        {...defaultProps}
        onStatusFilterChange={onStatusFilterChange}
      />,
    );
    const liveTab = screen.getByRole("tab", { name: "status.live" });
    await userEvent.click(liveTab);
    expect(onStatusFilterChange).toHaveBeenCalledWith("live");
  });

  it("shows loading overlay when isLoading is true", () => {
    renderWithTheme(
      <ScheduleStatusPresenter {...defaultProps} isLoading={true} />,
    );
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("does not show loading overlay when isLoading is false", () => {
    renderWithTheme(
      <ScheduleStatusPresenter {...defaultProps} isLoading={false} />,
    );
    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("FAB search button calls onSearchDialogOpen", async () => {
    const onSearchDialogOpen = vi.fn();
    renderWithTheme(
      <ScheduleStatusPresenter
        {...defaultProps}
        onSearchDialogOpen={onSearchDialogOpen}
      />,
    );
    const fab = screen.getByRole("button", { name: /search\.dateSearch/i });
    await userEvent.click(fab);
    expect(onSearchDialogOpen).toHaveBeenCalledOnce();
  });

  it("renders events and livestream content", () => {
    renderWithTheme(<ScheduleStatusPresenter {...defaultProps} />);
    expect(screen.getByTestId("events-content")).toBeInTheDocument();
    expect(screen.getByTestId("livestream-content")).toBeInTheDocument();
  });
});

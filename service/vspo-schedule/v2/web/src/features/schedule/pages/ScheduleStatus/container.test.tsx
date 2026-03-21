import { act, render, screen } from "@testing-library/react";
import { ScheduleStatusContainer } from "./container";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockPush = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, opts?: Record<string, string>) =>
    opts?.date ? `All (${opts.date}~)` : key,
}));

vi.mock("@/lib/utils", () => ({
  formatDate: () => "1/15",
  groupBy: <T,>(items: T[], keyGetter: (item: T) => string) => {
    const result: Record<string, T[]> = {};
    for (const item of items) {
      const key = keyGetter(item);
      if (!result[key]) result[key] = [];
      result[key].push(item);
    }
    return result;
  },
}));

// Capture props passed to the presenter
let capturedPresenterProps: Record<string, unknown> = {};

vi.mock("./presenter", () => ({
  ScheduleStatusPresenter: (props: Record<string, unknown>) => {
    capturedPresenterProps = props;
    return (
      <div data-testid="presenter">
        <span data-testid="status-filter">{props.statusFilter as string}</span>
        <span data-testid="all-tab-label">{props.allTabLabel as string}</span>
        <span data-testid="is-loading">{String(props.isLoading)}</span>
        <button
          type="button"
          data-testid="change-filter"
          onClick={() =>
            (props.onStatusFilterChange as (s: string) => void)("live")
          }
        />
        <button
          type="button"
          data-testid="open-search"
          onClick={props.onSearchDialogOpen as () => void}
        />
        <button
          type="button"
          data-testid="close-search"
          onClick={props.onSearchDialogClose as () => void}
        />
      </div>
    );
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const defaultProps = {
  livestreams: [],
  events: [],
  timeZone: "Asia/Tokyo",
  locale: "ja-JP",
  liveStatus: "all",
  isArchivePage: false,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("ScheduleStatusContainer", () => {
  beforeEach(() => {
    capturedPresenterProps = {};
    mockPush.mockClear();
  });

  it("renders presenter with default props", () => {
    render(<ScheduleStatusContainer {...defaultProps} />);
    expect(screen.getByTestId("presenter")).toBeInTheDocument();
    expect(screen.getByTestId("status-filter")).toHaveTextContent("all");
  });

  it.each([
    { input: "all", expected: "all" },
    { input: "live", expected: "live" },
    { input: "upcoming", expected: "upcoming" },
    { input: "invalid-status", expected: "all" },
    { input: "", expected: "all" },
  ])("validates liveStatus=$input -> statusFilter=$expected", ({
    input,
    expected,
  }) => {
    render(<ScheduleStatusContainer {...defaultProps} liveStatus={input} />);
    expect(screen.getByTestId("status-filter")).toHaveTextContent(expected);
  });

  it("navigates on tab change via onStatusFilterChange", () => {
    render(<ScheduleStatusContainer {...defaultProps} locale="ja-JP" />);

    act(() => {
      screen.getByTestId("change-filter").click();
    });

    expect(mockPush).toHaveBeenCalledWith("/schedule/live");
  });

  it("does not navigate when selecting the same filter", () => {
    render(<ScheduleStatusContainer {...defaultProps} liveStatus="live" />);

    // Capture the onStatusFilterChange and call with same status
    const handler = capturedPresenterProps.onStatusFilterChange as (
      s: string,
    ) => void;

    act(() => {
      handler("live");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("passes isArchivePage to presenter", () => {
    render(<ScheduleStatusContainer {...defaultProps} isArchivePage={true} />);

    expect(capturedPresenterProps.isArchivePage).toBe(true);
  });

  it("toggles search dialog open/close", () => {
    render(<ScheduleStatusContainer {...defaultProps} />);

    // Initially closed
    expect(capturedPresenterProps.isSearchDialogOpen).toBe(false);

    act(() => {
      screen.getByTestId("open-search").click();
    });
    expect(capturedPresenterProps.isSearchDialogOpen).toBe(true);

    act(() => {
      screen.getByTestId("close-search").click();
    });
    expect(capturedPresenterProps.isSearchDialogOpen).toBe(false);
  });
});

import { render, screen, act } from "@testing-library/react";
import type React from "react";
import { DateSearchDialogContainer } from "./DateSearchDialogContainer";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockPush = vi.fn();
let mockQuery: Record<string, string | undefined> = {};

vi.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    query: mockQuery,
    pathname: "/ja/schedule/all",
  }),
}));

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) =>
      typeof fallback === "string" ? fallback : key,
  }),
}));

const mockSaveFavorite = vi.fn();
const mockDeleteFavorite = vi.fn();

vi.mock("../../../hooks/useFavoriteSearchConditions", () => ({
  useFavoriteSearchCondition: () => ({
    favorite: null,
    saveFavorite: mockSaveFavorite,
    deleteFavorite: mockDeleteFavorite,
    hasFavorite: false,
  }),
}));

// Capture props passed to the presentational DateSearchDialog
let capturedDialogProps: Record<string, unknown> = {};

vi.mock("./DateSearchDialog", () => ({
  DateSearchDialog: (props: Record<string, unknown>) => {
    capturedDialogProps = props;
    if (!props.open) return null;
    return (
      <div data-testid="date-search-dialog">
        <span data-testid="search-enabled">
          {String(props.isSearchEnabled)}
        </span>
        <span data-testid="date-input-value">
          {props.dateInputValue as string}
        </span>
        <button
          data-testid="submit-btn"
          onClick={props.onSubmit as () => void}
          disabled={!(props.isSearchEnabled as boolean)}
        />
        <button
          data-testid="clear-btn"
          onClick={props.onClear as () => void}
        />
        <button
          data-testid="close-btn"
          onClick={props.onClose as () => void}
        />
        <button
          data-testid="save-favorite-btn"
          onClick={props.onSaveFavorite as () => void}
        />
        <button
          data-testid="delete-favorite-btn"
          onClick={props.onDeleteFavorite as () => void}
        />
      </div>
    );
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockOnClose = vi.fn();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("DateSearchDialogContainer", () => {
  beforeEach(() => {
    mockQuery = {};
    capturedDialogProps = {};
    mockOnClose.mockClear();
  });

  it("renders dialog when open=true", () => {
    render(
      <DateSearchDialogContainer open={true} onClose={mockOnClose} />,
    );

    expect(screen.getByTestId("date-search-dialog")).toBeInTheDocument();
  });

  it("does not render dialog when open=false", () => {
    render(
      <DateSearchDialogContainer open={false} onClose={mockOnClose} />,
    );

    expect(screen.queryByTestId("date-search-dialog")).not.toBeInTheDocument();
  });

  it("search button is disabled initially (no filters applied)", () => {
    render(
      <DateSearchDialogContainer open={true} onClose={mockOnClose} />,
    );

    expect(screen.getByTestId("search-enabled")).toHaveTextContent("false");
    expect(screen.getByTestId("submit-btn")).toBeDisabled();
  });

  it("calls onClose and navigates on clear", () => {
    render(
      <DateSearchDialogContainer open={true} onClose={mockOnClose} />,
    );

    act(() => {
      screen.getByTestId("clear-btn").click();
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/ja/schedule/all",
      }),
      undefined,
      { shallow: false },
    );
  });

  it("passes onClose through to dialog", () => {
    render(
      <DateSearchDialogContainer open={true} onClose={mockOnClose} />,
    );

    act(() => {
      screen.getByTestId("close-btn").click();
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("initializes form data from query parameters", () => {
    mockQuery = {
      date: "2024-06-15",
      memberType: "vspo_jp",
      platform: "youtube",
    };

    render(
      <DateSearchDialogContainer open={true} onClose={mockOnClose} />,
    );

    // The date should be formatted and the form data populated
    expect(capturedDialogProps.dateInputValue).toBe("2024-06-15");
    const formData = capturedDialogProps.formData as {
      memberType: string;
      platform: string;
    };
    expect(formData.memberType).toBe("vspo_jp");
    expect(formData.platform).toBe("youtube");
  });

  it("enables search when date query param is present", () => {
    mockQuery = { date: "2024-06-15" };

    render(
      <DateSearchDialogContainer open={true} onClose={mockOnClose} />,
    );

    expect(screen.getByTestId("search-enabled")).toHaveTextContent("true");
  });

  it("invokes saveFavorite on save button click", () => {
    render(
      <DateSearchDialogContainer open={true} onClose={mockOnClose} />,
    );

    act(() => {
      screen.getByTestId("save-favorite-btn").click();
    });

    expect(mockSaveFavorite).toHaveBeenCalledWith({
      memberType: "vspo_all",
      platform: "",
    });
  });

  it("invokes deleteFavorite on delete button click", () => {
    render(
      <DateSearchDialogContainer open={true} onClose={mockOnClose} />,
    );

    act(() => {
      screen.getByTestId("delete-favorite-btn").click();
    });

    expect(mockDeleteFavorite).toHaveBeenCalledTimes(1);
  });

  it("handles date input change via onDateInputChange", () => {
    render(
      <DateSearchDialogContainer open={true} onClose={mockOnClose} />,
    );

    const handler = capturedDialogProps.onDateInputChange as (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => void;

    act(() => {
      handler({
        target: { value: "2024-03-20" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // After changing, the date input value should reflect the new value
    expect(capturedDialogProps.dateInputValue).toBe("2024-03-20");
    expect(capturedDialogProps.isSearchEnabled).toBe(true);
  });

  it("clears selectedDate when date input is emptied", () => {
    mockQuery = { date: "2024-06-15" };

    render(
      <DateSearchDialogContainer open={true} onClose={mockOnClose} />,
    );

    const handler = capturedDialogProps.onDateInputChange as (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => void;

    act(() => {
      handler({
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(capturedDialogProps.dateInputValue).toBe("");
    // With no date, no memberType change, no platform => search disabled
    expect(capturedDialogProps.isSearchEnabled).toBe(false);
  });

  it("submit navigates with query params and calls onClose", () => {
    mockQuery = { date: "2024-06-15" };

    render(
      <DateSearchDialogContainer open={true} onClose={mockOnClose} />,
    );

    act(() => {
      screen.getByTestId("submit-btn").click();
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/ja/schedule/all",
        query: expect.objectContaining({
          date: "2024-06-15",
        }),
      }),
      undefined,
      { shallow: false },
    );
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

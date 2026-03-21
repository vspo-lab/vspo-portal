import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeModeProvider } from "@/context/Theme";
import { DateSearchDialog } from "./DateSearchDialog";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  dateInputValue: "2024-01-15",
  formData: {
    selectedDate: new Date("2024-01-15"),
    memberType: "vspo_all",
    platform: "",
  },
  isSearchEnabled: true,
  favorite: null,
  hasFavorite: false,
  isSaveEnabled: true,
  onDateInputChange: vi.fn(),
  onMemberTypeChange: vi.fn(),
  onPlatformChange: vi.fn(),
  onSubmit: vi.fn(),
  onClear: vi.fn(),
  onSaveFavorite: vi.fn(),
  onLoadFavorite: vi.fn(),
  onDeleteFavorite: vi.fn(),
};

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeModeProvider>{ui}</ThemeModeProvider>);

describe("DateSearchDialog", () => {
  it("renders dialog when open", () => {
    renderWithTheme(<DateSearchDialog {...defaultProps} />);
    expect(screen.getByText("Date Search")).toBeInTheDocument();
  });

  it("does not render dialog content when closed", () => {
    renderWithTheme(<DateSearchDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Date Search")).not.toBeInTheDocument();
  });

  it("disables search button when isSearchEnabled is false", () => {
    renderWithTheme(
      <DateSearchDialog {...defaultProps} isSearchEnabled={false} />,
    );
    const searchButton = screen.getByRole("button", { name: "Search" });
    expect(searchButton).toBeDisabled();
  });

  it("enables search button when isSearchEnabled is true", () => {
    renderWithTheme(
      <DateSearchDialog {...defaultProps} isSearchEnabled={true} />,
    );
    const searchButton = screen.getByRole("button", { name: "Search" });
    expect(searchButton).toBeEnabled();
  });

  it("calls onSubmit when search button is clicked", async () => {
    const onSubmit = vi.fn();
    renderWithTheme(<DateSearchDialog {...defaultProps} onSubmit={onSubmit} />);
    const searchButton = screen.getByRole("button", { name: "Search" });
    await userEvent.click(searchButton);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("calls onClear when clear button is clicked", async () => {
    const onClear = vi.fn();
    renderWithTheme(<DateSearchDialog {...defaultProps} onClear={onClear} />);
    const clearButton = screen.getByRole("button", { name: "Clear" });
    await userEvent.click(clearButton);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const onClose = vi.fn();
    renderWithTheme(<DateSearchDialog {...defaultProps} onClose={onClose} />);
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await userEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("shows favorite section when hasFavorite is true", () => {
    renderWithTheme(
      <DateSearchDialog
        {...defaultProps}
        hasFavorite={true}
        favorite={{
          memberType: "vspo_all",
          platform: "",
          createdAt: "2024-01-15",
        }}
      />,
    );
    expect(screen.getByText("Saved Conditions")).toBeInTheDocument();
  });

  it("shows save button when hasFavorite is false", () => {
    renderWithTheme(<DateSearchDialog {...defaultProps} hasFavorite={false} />);
    expect(
      screen.getByRole("button", { name: "Save Current Conditions" }),
    ).toBeInTheDocument();
  });

  it("renders favorite with vspo_all memberType and no platform", () => {
    renderWithTheme(
      <DateSearchDialog
        {...defaultProps}
        hasFavorite={true}
        favorite={{
          memberType: "vspo_all",
          platform: "",
          createdAt: "2024-01-15",
        }}
      />,
    );
    // vspo_all → key "search.memberType.all", fallback "vspo_all" → mock returns "vspo_all"
    // platform is falsy → t("search.platform.all", "All Platforms") → mock returns "All Platforms"
    expect(screen.getByText("vspo_all | All Platforms")).toBeInTheDocument();
  });

  it("renders favorite with non-vspo_all memberType and truthy platform", () => {
    renderWithTheme(
      <DateSearchDialog
        {...defaultProps}
        hasFavorite={true}
        favorite={{
          memberType: "vspo_jp",
          platform: "youtube",
          createdAt: "2024-01-15",
        }}
      />,
    );
    // vspo_jp → key "search.memberType.jp", fallback "vspo_jp" → mock returns "vspo_jp"
    // platform = "youtube" → t("search.platform.youtube", "youtube") → mock returns "youtube"
    expect(screen.getByText("vspo_jp | youtube")).toBeInTheDocument();
  });

  it("renders favorite with null memberType using empty fallback", () => {
    renderWithTheme(
      <DateSearchDialog
        {...defaultProps}
        hasFavorite={true}
        favorite={{
          memberType: undefined as unknown as "vspo_all",
          platform: "",
          createdAt: "2024-01-15",
        }}
      />,
    );
    // memberType undefined → fallback "" → mock returns ""
    // platform falsy → "All Platforms"
    // Result: " | All Platforms"
    expect(
      screen.getByText((_content, element) => {
        return element?.textContent === " | All Platforms";
      }),
    ).toBeInTheDocument();
  });

  it("renders favorite with vspo_en memberType and twitch platform", () => {
    renderWithTheme(
      <DateSearchDialog
        {...defaultProps}
        hasFavorite={true}
        favorite={{
          memberType: "vspo_en",
          platform: "twitch",
          createdAt: "2024-01-15",
        }}
      />,
    );
    // vspo_en → key "search.memberType.en", fallback "vspo_en" → mock returns "vspo_en"
    // platform = "twitch" → t("search.platform.twitch", "twitch") → mock returns "twitch"
    expect(screen.getByText("vspo_en | twitch")).toBeInTheDocument();
  });
});

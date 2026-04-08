import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeModeProvider } from "@/context/Theme";
import { DateSearchDialog } from "./DateSearchDialog";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
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
    expect(screen.getByText("search.title")).toBeInTheDocument();
  });

  it("does not render dialog content when closed", () => {
    renderWithTheme(<DateSearchDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("search.title")).not.toBeInTheDocument();
  });

  it("disables search button when isSearchEnabled is false", () => {
    renderWithTheme(
      <DateSearchDialog {...defaultProps} isSearchEnabled={false} />,
    );
    const searchButton = screen.getByRole("button", { name: "search.search" });
    expect(searchButton).toBeDisabled();
  });

  it("enables search button when isSearchEnabled is true", () => {
    renderWithTheme(
      <DateSearchDialog {...defaultProps} isSearchEnabled={true} />,
    );
    const searchButton = screen.getByRole("button", { name: "search.search" });
    expect(searchButton).toBeEnabled();
  });

  it("calls onSubmit when search button is clicked", async () => {
    const onSubmit = vi.fn();
    renderWithTheme(<DateSearchDialog {...defaultProps} onSubmit={onSubmit} />);
    const searchButton = screen.getByRole("button", { name: "search.search" });
    await userEvent.click(searchButton);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("calls onClear when clear button is clicked", async () => {
    const onClear = vi.fn();
    renderWithTheme(<DateSearchDialog {...defaultProps} onClear={onClear} />);
    const clearButton = screen.getByRole("button", { name: "search.clear" });
    await userEvent.click(clearButton);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const onClose = vi.fn();
    renderWithTheme(<DateSearchDialog {...defaultProps} onClose={onClose} />);
    const cancelButton = screen.getByRole("button", { name: "search.cancel" });
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
    expect(screen.getByText("search.favorites.saved")).toBeInTheDocument();
  });

  it("shows save button when hasFavorite is false", () => {
    renderWithTheme(<DateSearchDialog {...defaultProps} hasFavorite={false} />);
    expect(
      screen.getByRole("button", { name: "search.favorites.saveButton" }),
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
    // vspo_all → key "search.memberType.all" → mock returns "search.memberType.all"
    // platform is falsy → t("search.platform.all") → mock returns "search.platform.all"
    expect(
      screen.getByText("search.memberType.all | search.platform.all"),
    ).toBeInTheDocument();
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
    // vspo_jp → key "search.memberType.jp" → mock returns "search.memberType.jp"
    // platform = "youtube" → t("search.platform.youtube") → mock returns "search.platform.youtube"
    expect(
      screen.getByText("search.memberType.jp | search.platform.youtube"),
    ).toBeInTheDocument();
  });

  it("renders favorite with null memberType using key-based fallback", () => {
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
    // memberType undefined → key "search.memberType.undefined" → mock returns "search.memberType.undefined"
    // platform falsy → "search.platform.all"
    expect(
      screen.getByText((_content, element) => {
        return (
          element?.textContent ===
          "search.memberType.undefined | search.platform.all"
        );
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
    // vspo_en → key "search.memberType.en" → mock returns "search.memberType.en"
    // platform = "twitch" → t("search.platform.twitch") → mock returns "search.platform.twitch"
    expect(
      screen.getByText("search.memberType.en | search.platform.twitch"),
    ).toBeInTheDocument();
  });
});

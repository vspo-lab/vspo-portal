import { act, renderHook } from "@testing-library/react";
import { useFavoriteSearchCondition } from "./useFavoriteSearchConditions";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockSetCookie = vi.fn();
let mockCookieValue: string | undefined;

vi.mock("@/hooks/cookie", () => ({
  useCookie: () => [mockCookieValue, mockSetCookie],
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useFavoriteSearchCondition", () => {
  beforeEach(() => {
    mockCookieValue = undefined;
    mockSetCookie.mockClear();
  });

  it("returns null favorite when no cookie is set", () => {
    const { result } = renderHook(() => useFavoriteSearchCondition());

    expect(result.current.favorite).toBeNull();
    expect(result.current.hasFavorite).toBe(false);
  });

  it("parses a valid JSON cookie into a FavoriteSearchCondition", () => {
    mockCookieValue = JSON.stringify({
      memberType: "vspo_jp",
      platform: "youtube",
      createdAt: "2024-01-15T00:00:00Z",
    });

    const { result } = renderHook(() => useFavoriteSearchCondition());

    expect(result.current.favorite).toEqual({
      memberType: "vspo_jp",
      platform: "youtube",
      createdAt: "2024-01-15T00:00:00Z",
    });
    expect(result.current.hasFavorite).toBe(true);
  });

  it("returns null for invalid JSON cookie", () => {
    mockCookieValue = "not-valid-json{{{";

    const { result } = renderHook(() => useFavoriteSearchCondition());

    expect(result.current.favorite).toBeNull();
    expect(result.current.hasFavorite).toBe(false);
  });

  it("saveFavorite writes JSON to cookie with createdAt timestamp", () => {
    const { result } = renderHook(() => useFavoriteSearchCondition());

    act(() => {
      result.current.saveFavorite({
        memberType: "vspo_en",
        platform: "twitch",
      });
    });

    expect(mockSetCookie).toHaveBeenCalledTimes(1);
    const writtenValue = mockSetCookie.mock.calls[0][0];
    const parsed = JSON.parse(writtenValue);
    expect(parsed.memberType).toBe("vspo_en");
    expect(parsed.platform).toBe("twitch");
    expect(parsed.createdAt).toBeDefined();
    // createdAt should be a valid ISO string
    expect(new Date(parsed.createdAt).toISOString()).toBe(parsed.createdAt);
  });

  it("saveFavorite returns the new condition with createdAt", () => {
    const { result } = renderHook(() => useFavoriteSearchCondition());

    let returned: ReturnType<typeof result.current.saveFavorite> | undefined;
    act(() => {
      returned = result.current.saveFavorite({
        memberType: "vspo_ch",
        platform: "",
      });
    });

    expect(returned).toMatchObject({
      memberType: "vspo_ch",
      platform: "",
    });
    expect(returned?.createdAt).toBeDefined();
  });

  it("deleteFavorite clears the cookie by setting undefined", () => {
    mockCookieValue = JSON.stringify({
      memberType: "vspo_all",
      platform: "",
      createdAt: "2024-01-15T00:00:00Z",
    });

    const { result } = renderHook(() => useFavoriteSearchCondition());

    act(() => {
      result.current.deleteFavorite();
    });

    expect(mockSetCookie).toHaveBeenCalledWith(undefined);
  });

  it("returns empty string cookie as null favorite", () => {
    mockCookieValue = "";

    const { result } = renderHook(() => useFavoriteSearchCondition());

    expect(result.current.favorite).toBeNull();
    expect(result.current.hasFavorite).toBe(false);
  });
});

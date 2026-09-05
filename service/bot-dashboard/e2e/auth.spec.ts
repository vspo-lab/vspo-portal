import { type APIRequestContext, expect, test } from "@playwright/test";
import { ORIGIN, openUserMenu, switchLanguage } from "./helpers";

const DISCORD_AUTHORIZE = "https://discord.com/api/oauth2/authorize";

/** Follows the login redirect only far enough to learn the CSRF state stored in the session. */
const startLogin = async (request: APIRequestContext): Promise<string> => {
  const response = await request.get("/auth/discord", { maxRedirects: 0 });
  expect(response.status()).toBe(302);
  const location = new URL(response.headers().location);
  const state = location.searchParams.get("state");
  expect(state).toBeTruthy();
  return state as string;
};

test.describe("Discord ログイン（Discord 側はモック）", () => {
  test("ログイン導線は PKCE 付きの Discord 認可 URL へリダイレクトする", async ({
    request,
  }) => {
    const response = await request.get("/auth/discord", { maxRedirects: 0 });
    expect(response.status()).toBe(302);

    const location = new URL(response.headers().location);
    expect(`${location.origin}${location.pathname}`).toBe(DISCORD_AUTHORIZE);
    expect(location.searchParams.get("client_id")).toBe("e2e-client-id");
    expect(location.searchParams.get("redirect_uri")).toBe(
      `${ORIGIN}/auth/callback`,
    );
    expect(location.searchParams.get("response_type")).toBe("code");
    expect(location.searchParams.get("scope")).toBe("identify guilds");
    expect(location.searchParams.get("code_challenge_method")).toBe("S256");
    expect(location.searchParams.get("code_challenge")).toMatch(
      /^[A-Za-z0-9_-]{43}$/,
    );
    expect(location.searchParams.get("state")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  test("Discord がエラーを返した場合は auth_failed でトップへ戻る", async ({
    request,
  }) => {
    const response = await request.get("/auth/callback?error=access_denied", {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe("/?error=auth_failed");
  });

  test("state が一致しないコールバックは invalid_state で拒否される", async ({
    request,
  }) => {
    await startLogin(request);
    const response = await request.get("/auth/callback?state=forged&code=x", {
      maxRedirects: 0,
    });
    expect(response.headers().location).toBe("/?error=invalid_state");
  });

  test("code の無いコールバックは no_code で戻る", async ({ request }) => {
    const state = await startLogin(request);
    const response = await request.get(`/auth/callback?state=${state}`, {
      maxRedirects: 0,
    });
    expect(response.headers().location).toBe("/?error=no_code");
  });

  test("正しい state と code のコールバックはダッシュボードへ遷移する", async ({
    request,
  }) => {
    const state = await startLogin(request);
    const response = await request.get(
      `/auth/callback?state=${state}&code=mock-code`,
      { maxRedirects: 0 },
    );
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe("/dashboard");
  });

  test("使用済みの state は再利用できない", async ({ request }) => {
    const state = await startLogin(request);
    await request.get(`/auth/callback?state=${state}&code=mock-code`, {
      maxRedirects: 0,
    });
    const replay = await request.get(
      `/auth/callback?state=${state}&code=mock-code`,
      { maxRedirects: 0 },
    );
    expect(replay.headers().location).toBe("/?error=invalid_state");
  });
});

test.describe("ログアウト", () => {
  test("ログアウトはセッションを破棄してトップへリダイレクトする", async ({
    request,
  }) => {
    const response = await request.post("/auth/logout", {
      headers: { origin: ORIGIN },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe("/");
  });

  test("ユーザーメニューからログアウトすると言語設定などのセッションが消える", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await switchLanguage(page, "English");

    await openUserMenu(page);
    await page.getByRole("button", { name: "Logout" }).click();

    // The mock middleware logs the user straight back in, so the visible effect
    // of the destroyed session is the locale falling back to the default.
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(
      page.getByRole("heading", { level: 1, name: "サーバー一覧" }),
    ).toBeVisible();
  });
});

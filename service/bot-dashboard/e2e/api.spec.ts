import { expect, test } from "@playwright/test";
import { DEV_GUILD_ID, ORIGIN, OTHER_GUILD_ID } from "./helpers";

// Astro's `security.checkOrigin` rejects form posts without a same-origin Origin header.
const sameOrigin = { origin: ORIGIN };

test.describe("API ルート", () => {
  test("GET /api/guilds/:guildId/channels はテキストチャンネル一覧を返す", async ({
    request,
  }) => {
    const response = await request.get(`/api/guilds/${DEV_GUILD_ID}/channels`);
    expect(response.status()).toBe(200);
    const channels = (await response.json()) as { id: string; name: string }[];
    expect(channels).toHaveLength(6);
    expect(channels.map((ch) => ch.name)).toEqual(
      expect.arrayContaining(["vspo-notifications", "general", "random"]),
    );
  });

  test("Bot 未導入サーバーのチャンネル一覧は空配列", async ({ request }) => {
    const response = await request.get(
      `/api/guilds/${OTHER_GUILD_ID}/channels`,
    );
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  test("Snowflake でない guildId は 400", async ({ request }) => {
    const response = await request.get("/api/guilds/not-a-guild/channels");
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid guildId" });
  });

  test("Origin ヘッダーの無いフォーム送信は CSRF 対策で拒否される", async ({
    request,
  }) => {
    const response = await request.post("/api/change-locale", {
      form: { locale: "en" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(403);
  });

  test("POST /api/change-locale は言語を保存して _returnTo に戻る", async ({
    request,
  }) => {
    const response = await request.post("/api/change-locale", {
      form: { locale: "en", _returnTo: "/dashboard/announcements" },
      headers: sameOrigin,
      maxRedirects: 0,
    });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe("/dashboard/announcements");

    const page = await request.get("/dashboard");
    expect(await page.text()).toContain('<html lang="en"');
  });

  test("外部 URL の _returnTo は無視され Referer に戻る", async ({
    request,
  }) => {
    const response = await request.post("/api/change-locale", {
      form: { locale: "ja", _returnTo: "https://evil.example/phish" },
      headers: { ...sameOrigin, referer: `${ORIGIN}/dashboard/announcements` },
      maxRedirects: 0,
    });
    expect(response.headers().location).toBe(
      `${ORIGIN}/dashboard/announcements`,
    );
  });

  test("プロトコル相対 URL の _returnTo も無視され、Referer が無ければトップに戻る", async ({
    request,
  }) => {
    const response = await request.post("/api/change-locale", {
      form: { locale: "ja", _returnTo: "//evil.example/phish" },
      headers: sameOrigin,
      maxRedirects: 0,
    });
    expect(response.headers().location).toBe("/");
  });
});

test.describe("静的ルートとエラーページ", () => {
  test("robots.txt はダッシュボード・認証・API をクロール対象外にする", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");
    expect(await response.text()).toBe(
      [
        "User-agent: *",
        "Allow: /",
        "Allow: /en/",
        "Disallow: /dashboard/",
        "Disallow: /en/dashboard/",
        "Disallow: /auth/",
        "Disallow: /en/auth/",
        "Disallow: /api/",
        "",
      ].join("\n"),
    );
  });

  test("存在しないページは 404 とホームへの導線を表示する", async ({
    page,
  }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: "404" }),
    ).toBeVisible();
    await expect(page.getByText("ページが見つかりませんでした")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "ホームに戻る" }),
    ).toHaveAttribute("href", "/");
  });

  test("すべてのレスポンスにセキュリティヘッダーが付く", async ({
    request,
  }) => {
    const response = await request.get("/?preview");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
  });
});

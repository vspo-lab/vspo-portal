import { expect, test } from "./fixtures";

test.describe("HTTP レベルの振る舞い", () => {
  test("/ は /schedule/all へ恒久リダイレクトする", async ({ request }) => {
    const response = await request.get("/", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toMatch(/\/schedule\/all$/);
  });

  test("旧 URL は新 URL へリダイレクトする", async ({ request }) => {
    const notifications = await request.get("/notifications/1", {
      maxRedirects: 0,
    });
    expect(notifications.status()).toBe(308);
    expect(notifications.headers().location).toMatch(/\/site-news\/1$/);

    const legacyDefault = await request.get("/default/schedule/all", {
      maxRedirects: 0,
    });
    expect(legacyDefault.status()).toBe(308);
    expect(legacyDefault.headers().location).toMatch(/\/schedule\/all$/);
  });

  test("robots.txt と sitemap.xml が配信される", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain("User-Agent");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    expect(sitemap.headers()["content-type"]).toContain("xml");
    expect(await sitemap.text()).toContain("/schedule/all");
  });

  test("セキュリティヘッダーが付与される", async ({ request }) => {
    const response = await request.get("/schedule/all");
    expect(response.ok()).toBeTruthy();
    const headers = response.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("ロケール付き URL は対応する言語でレンダリングされる", async ({
    request,
  }) => {
    const en = await request.get("/en/schedule/all");
    expect(en.ok()).toBeTruthy();
    expect(await en.text()).toContain('lang="en"');

    const ko = await request.get("/ko/schedule/all");
    expect(ko.ok()).toBeTruthy();
    expect(await ko.text()).toContain('lang="ko"');
  });

  test("未知のパスは 404 を返す", async ({ request }) => {
    const response = await request.get("/definitely-missing");
    expect(response.status()).toBe(404);
  });
});

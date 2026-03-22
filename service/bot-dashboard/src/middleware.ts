import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";

const MOCK_USER = {
  id: "000000000000000000",
  username: "dev-user",
  displayName: "Dev User",
  avatar: null,
} as const;

export const onRequest = defineMiddleware(async (context, next) => {
  const sessionLocale = await context.session?.get("locale");
  context.locals.locale = sessionLocale ?? "ja";

  const devMockAuth = (env as unknown as Record<string, unknown>).DEV_MOCK_AUTH;
  if (devMockAuth === "true" && import.meta.env.DEV) {
    context.locals.user = MOCK_USER;
    context.locals.accessToken = "mock-access-token";
    return next();
  }

  const user = await context.session?.get("user");
  context.locals.user = user ?? null;
  context.locals.accessToken = user
    ? ((await context.session?.get("accessToken")) ?? null)
    : null;

  if (!user && context.url.pathname.startsWith("/dashboard")) {
    return context.redirect("/");
  }

  return next();
});

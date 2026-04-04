import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import { DiscordApiRepository } from "~/features/auth/repository/discord-api";

/** Buffer in ms — refresh 5 minutes before actual expiry. */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

const MOCK_USER = {
  id: "000000000000000000",
  username: "dev-user",
  displayName: "Dev User",
  avatar: null,
} as const;

export const onRequest = defineMiddleware(async (context, next) => {
  const sessionLocale = await context.session?.get("locale");
  const locale = sessionLocale ?? "ja";
  context.locals.locale = locale;
  if (!sessionLocale) {
    context.session?.set("locale", locale);
  }

  const devMockAuth = (env as unknown as Record<string, unknown>).DEV_MOCK_AUTH;
  if (devMockAuth === "true" && import.meta.env.DEV) {
    context.locals.user = MOCK_USER;
    context.locals.accessToken = "mock-access-token";
    return next();
  }

  const user = await context.session?.get("user");
  context.locals.user = user ?? null;

  if (!user) {
    context.locals.accessToken = null;
    if (context.url.pathname.startsWith("/dashboard")) {
      return context.redirect("/");
    }
    return next();
  }

  // Check token expiry and refresh if needed
  const expiresAt = (await context.session?.get("expiresAt")) ?? 0;
  const now = getCurrentUTCDate().getTime();

  if (now >= expiresAt - REFRESH_BUFFER_MS) {
    const refreshToken = await context.session?.get("refreshToken");
    if (!refreshToken) {
      context.session?.destroy();
      return context.redirect("/?error=auth_failed");
    }

    const refreshResult = await DiscordApiRepository.refreshToken({
      refreshToken,
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    });

    if (refreshResult.err) {
      context.session?.destroy();
      return context.redirect("/?error=auth_failed");
    }

    const tokens = refreshResult.val;
    const newExpiresAt = now + tokens.expires_in * 1000;
    context.session?.set("accessToken", tokens.access_token);
    context.session?.set("refreshToken", tokens.refresh_token);
    context.session?.set("expiresAt", newExpiresAt);
    context.locals.accessToken = tokens.access_token;
  } else {
    context.locals.accessToken =
      (await context.session?.get("accessToken")) ?? null;
  }

  return next();
});

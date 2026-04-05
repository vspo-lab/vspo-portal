import { defineMiddleware, sequence } from "astro:middleware";
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

/**
 * Security headers applied to every response.
 *
 * - `'unsafe-inline'` in script-src/style-src: required for Astro `is:inline` scripts and Tailwind inline styles.
 * - `cdn.discordapp.com` in img-src: Discord user avatars.
 * - `discord.com` in connect-src: Discord OAuth API calls.
 * - frame-ancestors 'none': prevents clickjacking (mirrors X-Frame-Options: DENY).
 */
const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
  [
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://cdn.discordapp.com data:; connect-src 'self' https://discord.com; frame-ancestors 'none'",
  ],
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
] as const;

/**
 * Appends security headers to a Response.
 * @param response - The Response to augment.
 * @returns The same Response with security headers set.
 */
const applySecurityHeaders = (response: Response): Response => {
  for (const [name, value] of SECURITY_HEADERS) {
    response.headers.set(name, value);
  }
  return response;
};

/** Middleware: sets security headers on every response. */
const securityHeaders = defineMiddleware(async (_context, next) => {
  const response = await next();
  return applySecurityHeaders(response);
});

/**
 * Middleware: authentication, session locale, and token refresh.
 *
 * CSRF note: Astro Actions with `accept: "form"` automatically include CSRF
 * protection via the `_astroAction` hidden field. The `/api/change-locale`
 * endpoint only sets a non-sensitive cookie preference and does not perform
 * destructive operations, so explicit CSRF protection is not required for it.
 */
const auth = defineMiddleware(async (context, next) => {
  const devMockAuth =
    "DEV_MOCK_AUTH" in env
      ? (env as Record<string, unknown>).DEV_MOCK_AUTH
      : undefined;
  if (import.meta.env.DEV && devMockAuth !== "false") {
    const devLocale = (await context.session?.get("locale")) ?? "ja";
    context.locals.locale = devLocale;
    context.locals.user = MOCK_USER;
    context.locals.accessToken = "mock-access-token";
    return next();
  }

  // Read session values in parallel to reduce KV round-trips
  const [sessionLocale, user, expiresAt, accessToken] = await Promise.all([
    context.session?.get("locale"),
    context.session?.get("user"),
    context.session?.get("expiresAt"),
    context.session?.get("accessToken"),
  ]);

  const locale = sessionLocale ?? "ja";
  context.locals.locale = locale;
  if (!sessionLocale) {
    context.session?.set("locale", locale);
  }

  context.locals.user = user ?? null;

  if (!user) {
    context.locals.accessToken = null;
    if (context.url.pathname.startsWith("/dashboard")) {
      return context.redirect("/");
    }
    return next();
  }

  // Check token expiry and refresh if needed
  const now = getCurrentUTCDate().getTime();

  if (now >= (expiresAt ?? 0) - REFRESH_BUFFER_MS) {
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
    context.locals.accessToken = accessToken ?? null;
  }

  return next();
});

export const onRequest = sequence(securityHeaders, auth);

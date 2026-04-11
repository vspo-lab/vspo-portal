import { DEV_MOCK_AUTH } from "astro:env/server";
import { defineMiddleware, sequence } from "astro:middleware";
import { env } from "cloudflare:workers";
import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import { DiscordOAuthRpcRepository } from "~/features/auth/repository/discord-oauth-rpc";

/** Buffer in ms — refresh 5 minutes before actual expiry. */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

/** Idle timeout — destroy session after 2 hours of inactivity. */
const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;

const MOCK_USER = {
  id: "000000000000000000",
  username: "dev-user",
  displayName: "Dev User",
  avatar: null,
} as const;

/**
 * Non-CSP security headers applied to every response.
 *
 * CSP note: `'unsafe-inline'` in script-src is required while `<ClientRouter />` is active.
 * Once ClientRouter is removed, migrate to Astro built-in `security.csp` with hash-based
 * directives (see docs/astro/19_CSP_BUILTIN.md).
 */
const STATIC_HEADERS: ReadonlyArray<readonly [string, string]> = [
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Strict-Transport-Security", "max-age=31536000; includeSubDomains"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
] as const;

/**
 * Static CSP header value.
 *
 * While `<ClientRouter />` is active, Astro emits nonce-less inline hydration
 * scripts for React islands. Including a nonce in `script-src` causes the
 * browser to ignore `'unsafe-inline'` (CSP Level 2 spec), which blocks those
 * hydration scripts. Therefore, the nonce is intentionally omitted here and
 * `'unsafe-inline'` is used until the project migrates to hash-based CSP.
 */
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' https://cdn.discordapp.com https://yt3.ggpht.com https://lh3.googleusercontent.com data:",
  "connect-src 'self' https://discord.com",
  "frame-ancestors 'none'",
].join("; ");

/** Discord Snowflake pattern: 17-20 digit string */
const SNOWFLAKE_RE = /^\d{17,20}$/;

/**
 * Extract guildId from guild-scoped URL paths.
 * Matches `/dashboard/:guildId` and `/api/guilds/:guildId/*`.
 * @postcondition Returns a valid snowflake string or null
 */
const extractGuildId = (pathname: string): string | null => {
  const segments = pathname.split("/");
  // /dashboard/:guildId → segments = ["", "dashboard", guildId, ...]
  if (segments[1] === "dashboard" && segments[2]) {
    return SNOWFLAKE_RE.test(segments[2]) ? segments[2] : null;
  }
  // /api/guilds/:guildId/* → segments = ["", "api", "guilds", guildId, ...]
  if (segments[1] === "api" && segments[2] === "guilds" && segments[3]) {
    return SNOWFLAKE_RE.test(segments[3]) ? segments[3] : null;
  }
  return null;
};

/** Middleware: sets security headers on every response. */
const securityHeaders = defineMiddleware(async (_context, next) => {
  const response = await next();
  response.headers.set("Content-Security-Policy", CSP_HEADER);
  for (const [name, value] of STATIC_HEADERS) {
    response.headers.set(name, value);
  }
  return response;
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
  if (import.meta.env.DEV && DEV_MOCK_AUTH !== false) {
    const devLocale = (await context.session?.get("locale")) ?? "ja";
    context.locals.locale = devLocale;
    context.locals.user = MOCK_USER;
    context.locals.accessToken = "mock-access-token";
    return next();
  }

  // Read session values in parallel to reduce KV round-trips
  const [
    sessionLocale,
    user,
    expiresAt,
    accessToken,
    lastActivity,
    guildSummaries,
  ] = await Promise.all([
    context.session?.get("locale"),
    context.session?.get("user"),
    context.session?.get("expiresAt"),
    context.session?.get("accessToken"),
    context.session?.get("lastActivity"),
    context.session?.get("guildSummaries"),
  ]);

  // Idle timeout — destroy session if inactive for 2 hours
  const now = getCurrentUTCDate().getTime();
  if (
    user &&
    lastActivity &&
    now - (lastActivity as number) > IDLE_TIMEOUT_MS
  ) {
    context.session?.destroy();
    return context.redirect("/?error=auth_failed");
  }
  context.session?.set("lastActivity", now);

  const preferred = context.preferredLocale;
  const locale = sessionLocale ?? (preferred === "en" ? "en" : "ja");
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

  if (now >= (expiresAt ?? 0) - REFRESH_BUFFER_MS) {
    const refreshToken = await context.session?.get("refreshToken");
    if (!refreshToken) {
      context.session?.destroy();
      return context.redirect("/?error=auth_failed");
    }

    const refreshResult = await DiscordOAuthRpcRepository.refreshToken(
      env.APP_WORKER,
      refreshToken as string,
    );

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

  // Guild-level authorization for guild-scoped routes.
  // Uses session-cached guildSummaries (set by /dashboard page) to avoid
  // an extra RPC round-trip on every request. Mutations still perform a
  // real-time RPC check in their action handlers.
  // If no cache exists (direct bookmark), allow through — the page itself
  // will fetch and verify via ListGuildsUsecase.
  const guildId = extractGuildId(context.url.pathname);
  if (guildId && guildSummaries) {
    const cached = (
      guildSummaries as ReadonlyArray<{ id: string; isAdmin: boolean }>
    ).find((g) => g.id === guildId);
    if (cached && !cached.isAdmin) {
      if (context.url.pathname.startsWith("/api/")) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      return context.redirect("/dashboard");
    }
  }

  return next();
});

export const onRequest = sequence(securityHeaders, auth);

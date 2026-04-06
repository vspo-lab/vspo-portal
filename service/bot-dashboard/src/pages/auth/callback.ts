import { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI } from "astro:env/server";
import type { APIRoute } from "astro";
import { LoginUsecase } from "~/features/auth/usecase/login";

export const GET: APIRoute = async (context) => {
  // Handle Discord error responses (e.g., user denied consent)
  const error = context.url.searchParams.get("error");
  if (error) {
    return context.redirect("/?error=auth_failed");
  }

  const state = context.url.searchParams.get("state");
  const sessionState = await context.session?.get("oauth_state");
  if (!state || state !== sessionState) {
    return context.redirect("/?error=invalid_state");
  }
  // Consume state to prevent replay
  context.session?.set("oauth_state", "");

  const code = context.url.searchParams.get("code");
  if (!code) {
    return context.redirect("/?error=no_code");
  }

  const codeVerifier = await context.session?.get("pkce_verifier");
  context.session?.set("pkce_verifier", "");

  const result = await LoginUsecase.handleCallback(
    code,
    { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI },
    codeVerifier ?? undefined,
  );

  if (result.err) {
    return context.redirect("/?error=auth_failed");
  }

  const { user, accessToken, refreshToken, expiresAt, locale } = result.val;
  context.session?.set("user", {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
  });
  context.session?.set("accessToken", accessToken);
  context.session?.set("refreshToken", refreshToken);
  context.session?.set("expiresAt", expiresAt);
  const existingLocale = await context.session?.get("locale");
  if (!existingLocale) {
    context.session?.set("locale", locale?.startsWith("en") ? "en" : "ja");
  }

  return context.redirect("/dashboard");
};

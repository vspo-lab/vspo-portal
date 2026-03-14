import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { LoginUsecase } from "~/features/auth/usecase/login";

export const GET: APIRoute = async (context) => {
  const code = context.url.searchParams.get("code");
  if (!code) {
    return context.redirect("/?error=no_code");
  }

  const result = await LoginUsecase.handleCallback(code, {
    DISCORD_CLIENT_ID: env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: env.DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI: env.DISCORD_REDIRECT_URI,
  });

  if (result.err) {
    return context.redirect("/?error=auth_failed");
  }

  const { user, accessToken, refreshToken, expiresAt } = result.val;
  context.session.set("user", {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
  });
  context.session.set("accessToken", accessToken);
  context.session.set("refreshToken", refreshToken);
  context.session.set("expiresAt", expiresAt);

  return context.redirect("/dashboard");
};

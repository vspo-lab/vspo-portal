import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { LoginUsecase } from "~/features/auth/usecase/login";

export const GET: APIRoute = async (context) => {
  const { url, state } = LoginUsecase.buildAuthorizationUrl({
    DISCORD_CLIENT_ID: env.DISCORD_CLIENT_ID,
    DISCORD_REDIRECT_URI: env.DISCORD_REDIRECT_URI,
  });

  context.session?.set("oauth_state", state);

  return new Response(null, {
    status: 302,
    headers: { Location: url },
  });
};

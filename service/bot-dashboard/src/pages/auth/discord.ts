import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { LoginUsecase } from "~/features/auth/usecase/login";

export const GET: APIRoute = () => {
  const url = LoginUsecase.buildAuthorizationUrl({
    DISCORD_CLIENT_ID: env.DISCORD_CLIENT_ID,
    DISCORD_REDIRECT_URI: env.DISCORD_REDIRECT_URI,
  });

  return new Response(null, {
    status: 302,
    headers: { Location: url },
  });
};

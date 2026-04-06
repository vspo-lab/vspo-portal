import { DISCORD_CLIENT_ID, DISCORD_REDIRECT_URI } from "astro:env/server";
import type { APIRoute } from "astro";
import { LoginUsecase } from "~/features/auth/usecase/login";

export const GET: APIRoute = async (context) => {
  const { url, state, codeVerifier } = await LoginUsecase.buildAuthorizationUrl({
    DISCORD_CLIENT_ID,
    DISCORD_REDIRECT_URI,
  });

  context.session?.set("oauth_state", state);
  context.session?.set("pkce_verifier", codeVerifier);

  return new Response(null, {
    status: 302,
    headers: { Location: url },
  });
};

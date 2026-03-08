import { redirect } from "react-router";
import { LoginUsecase } from "~/features/auth/index.server";
import type { Route } from "./+types/auth.callback";

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return redirect("/?error=missing_code");
  }

  const result = await LoginUsecase.handleCallback(
    code,
    context.cloudflare.env,
  );

  if (result.err) {
    return redirect(`/?error=${encodeURIComponent(result.err.message)}`);
  }

  return redirect("/dashboard", {
    headers: {
      "Set-Cookie": result.val.setCookieHeader,
    },
  });
}

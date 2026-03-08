import { redirect } from "react-router";
import { LoginUsecase } from "~/features/auth/index.server";
import type { Route } from "./+types/auth.discord";

export function loader({ context }: Route.LoaderArgs) {
  const url = LoginUsecase.buildAuthorizationUrl(context.cloudflare.env);
  return redirect(url);
}

import { redirect } from "react-router";
import { LandingContainer } from "~/features/auth";
import { GetCurrentUserUsecase } from "~/features/auth/index.server";
import type { Route } from "./+types/_index";

export async function loader({ request, context }: Route.LoaderArgs) {
  const result = await GetCurrentUserUsecase.execute(
    request,
    context.cloudflare.env.SESSION_SECRET,
  );

  if (!result.err) {
    return redirect("/dashboard");
  }

  return null;
}

export default function IndexRoute() {
  return <LandingContainer />;
}

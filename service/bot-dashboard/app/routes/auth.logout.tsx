import { redirect } from "react-router";
import { LogoutUsecase } from "~/features/auth/index.server";
import type { Route } from "./+types/auth.logout";

export async function action({ request, context }: Route.ActionArgs) {
  const setCookieHeader = LogoutUsecase.execute();

  return redirect("/", {
    headers: {
      "Set-Cookie": setCookieHeader,
    },
  });
}

import type { APIRoute } from "astro";

export const POST: APIRoute = async (context) => {
  context.session?.destroy();
  return context.redirect("/");
};

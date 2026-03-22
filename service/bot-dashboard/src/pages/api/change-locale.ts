import type { APIRoute } from "astro";

export const POST: APIRoute = async (context) => {
  const formData = await context.request.formData();
  const locale = formData.get("locale");
  const returnTo = formData.get("_returnTo");

  if (locale === "ja" || locale === "en") {
    context.session?.set("locale", locale);
  }

  const destination =
    typeof returnTo === "string" && returnTo.startsWith("/")
      ? returnTo
      : (context.request.headers.get("Referer") ?? "/");

  return context.redirect(destination);
};

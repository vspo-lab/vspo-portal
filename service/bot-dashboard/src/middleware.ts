import { defineMiddleware } from "astro:middleware";
import { detectLocale } from "~/i18n/dict";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.locale = detectLocale(
    context.request.headers.get("Accept-Language"),
  );

  const user = await context.session?.get("user");
  context.locals.user = user ?? null;
  context.locals.accessToken = user
    ? (await context.session?.get("accessToken")) ?? null
    : null;

  if (!user && context.url.pathname.startsWith("/dashboard")) {
    return context.redirect("/");
  }

  return next();
});

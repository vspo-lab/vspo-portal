import { defineMiddleware } from "astro:middleware";
import type { Locale } from "~/i18n/dict";

export const onRequest = defineMiddleware(async (context, next) => {
  const preferred = context.preferredLocale;
  context.locals.locale = (preferred === "en" ? "en" : "ja") as Locale;

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

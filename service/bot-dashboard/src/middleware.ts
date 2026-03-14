import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
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

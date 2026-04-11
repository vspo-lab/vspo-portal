import type { APIRoute } from "astro";

/**
 * Validates that a redirect target is a safe same-origin path.
 * Rejects protocol-relative URLs (//evil.com) and absolute URLs.
 * @precondition url is a non-empty string
 * @postcondition Returns true only if url resolves to the same origin
 */
const isSafeRedirect = (url: string, requestUrl: URL): boolean => {
  if (!url.startsWith("/") || url.startsWith("//")) return false;
  try {
    const resolved = new URL(url, requestUrl.origin);
    return resolved.origin === requestUrl.origin;
  } catch {
    return false;
  }
};

export const POST: APIRoute = async (context) => {
  const formData = await context.request.formData();
  const locale = formData.get("locale");
  const returnTo = formData.get("_returnTo");

  if (locale === "ja" || locale === "en") {
    context.session?.set("locale", locale);
  }

  const destination =
    typeof returnTo === "string" && isSafeRedirect(returnTo, context.url)
      ? returnTo
      : (context.request.headers.get("Referer") ?? "/");

  return context.redirect(destination);
};

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getRequestConfig } from "next-intl/server";
import { getCloudflareEnvironmentContext } from "@/lib/cloudflare/context";
import { routing } from "./routing";

const NAMESPACES = [
  "about",
  "clips",
  "common",
  "events",
  "freechat",
  "meta",
  "multiview",
  "privacy",
  "schedule",
  "site-news",
  "streams",
  "terms",
] as const;

async function loadNamespace(
  locale: string,
  ns: string,
  assets?: { fetch(url: string): Promise<Response> },
): Promise<Record<string, unknown>> {
  if (assets) {
    const response = await assets.fetch(
      `https://placeholder/locales/${locale}/${ns}.json`,
    );
    if (!response.ok) return {};
    return response.json() as Promise<Record<string, unknown>>;
  }
  // Local dev / build: read from filesystem
  const filePath = join(
    process.cwd(),
    "public",
    "locales",
    locale,
    `${ns}.json`,
  );
  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content) as Record<string, unknown>;
}

async function loadMessages(locale: string): Promise<Record<string, unknown>> {
  const { context, isValid } = await getCloudflareEnvironmentContext();
  const assets =
    isValid && !context.err
      ? (
          context.val?.env as unknown as {
            ASSETS?: { fetch(url: string): Promise<Response> };
          }
        )?.ASSETS
      : undefined;

  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => [ns, await loadNamespace(locale, ns, assets)]),
  );
  return Object.fromEntries(entries);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested &&
    routing.locales.includes(requested as (typeof routing.locales)[number])
      ? requested
      : routing.defaultLocale;

  const messages = await loadMessages(locale);

  return { locale, messages };
});

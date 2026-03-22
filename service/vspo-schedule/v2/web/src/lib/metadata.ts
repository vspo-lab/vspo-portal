import "server-only";

const BASE_URL = "https://www.vspo-schedule.com";
const LOCALES = ["en", "ja", "cn", "tw", "ko"] as const;

/**
 * Generate alternates metadata with hreflang and canonical URL.
 * @param path - The path without locale prefix (e.g., "/schedule/all")
 * @precondition path starts with "/" and does not include a locale prefix.
 * @postcondition Returns an object with canonical URL and hreflang language map.
 * @idempotent Yes - pure function with no side effects.
 */
export function generateAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[locale] =
      locale === "ja" ? `${BASE_URL}${path}` : `${BASE_URL}/${locale}${path}`;
  }
  languages["x-default"] = `${BASE_URL}${path}`;

  return {
    canonical: `${BASE_URL}${path}`,
    languages,
  };
}

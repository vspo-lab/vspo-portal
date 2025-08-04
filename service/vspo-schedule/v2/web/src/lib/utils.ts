import type { ServerResponse } from "node:http";
import type { ParsedUrlQuery } from "node:querystring";
import { convertToUTCDate, getCurrentUTCDate } from "@vspo-lab/dayjs";
import { isMatch, type Locale } from "date-fns";
import { enUS, ja, ko, zhCN, zhTW } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { createInstance as createI18nInstance } from "i18next";
import type { SSRConfig } from "next-i18next";
import { DEFAULT_LOCALE, SESSION_ID_COOKIE, TIME_ZONE_COOKIE } from "./Const";
/**
 * Group an array of items by a specified key.
 * @template T - The type of items in the array.
 * @param items - The array of items to group.
 * @param keyGetter - A function that returns the key for an item.
 * @returns - An object with keys representing the groups and values as arrays of items.
 */
export const groupBy = <T>(
  items: T[],
  keyGetter: (item: T) => string,
): Record<string, T[]> => {
  const groupedItems: Record<string, T[]> = {};

  for (const item of items) {
    const key = keyGetter(item);

    if (!groupedItems[key]) {
      groupedItems[key] = [];
    }

    groupedItems[key].push(item);
  }

  return groupedItems;
};

/**
 * Get a range of one week ago and one week later, without considering the time.
 * @returns - An object with `oneWeekAgo` and `oneWeekLater` properties representing the dates.
 */
export const getOneWeekRange = () => {
  const now = getCurrentUTCDate();
  now.setHours(0, 0, 0, 0); // Set time to 00:00:00

  const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;

  const oneWeekAgo = convertToUTCDate(now.getTime() - oneWeekInMilliseconds);
  const oneWeekLater = convertToUTCDate(now.getTime() + oneWeekInMilliseconds);

  return {
    oneWeekAgo,
    oneWeekLater,
  };
};

/**
 * Determines whether a date string matches a specific date format.
 * @param dateString - The date string to test.
 * @param dateFormat - The date format pattern to test the string against.
 * @returns True if the date string conforms to the date format, else false.
 */
export const matchesDateFormat = (dateString: string, dateFormat: string) => {
  return isMatch(dateString, dateFormat);
};

export const getSiteNewsTagColor = (tag: string) => {
  switch (tag) {
    case "feat":
      return "primary";
    case "fix":
      return "secondary";
    default:
      return "default";
  }
};

export const isValidYearMonth = (yearMonth: string) => {
  const regEx = /^\d{4}-\d{2}$/;
  if (!yearMonth.match(regEx)) return false; // Invalid format
  const d = convertToUTCDate(yearMonth);
  const dNum = d.getTime();
  if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
  return d.toISOString().slice(0, 7) === yearMonth;
};

export const dateStringOffSet = (dateString: string) => {
  const date = convertToUTCDate(dateString);
  const offset = date.getTimezoneOffset();
  return offset;
};

/**
 * Generates a path for each of the given paths in each of the given locales.
 * Use for generating paths for each locale in `getStaticPaths`.
 * @param paths - The paths to generated for each locale.
 * @param locales - The locales in which this page should be generated.
 * @returns The given paths in each of the given locales.
 */
export const generateStaticPathsForLocales = <
  Params extends ParsedUrlQuery = ParsedUrlQuery,
>(
  paths: { params: Params }[],
  locales: string[] | undefined,
) => {
  if (locales === undefined || locales.length === 0) {
    return paths;
  }
  return paths.flatMap((path) => {
    return locales.map((locale) => ({
      ...path,
      locale,
    }));
  });
};

/**
 * Gets an initialized i18n instance created from the config object given by
 * `serverSideTranslations`.
 * Enables translations to be used in `getStaticProps`.
 * @param translations - The object obtained from `serverSideTranslations`.
 * @returns An initialized i18n instance.
 */
export const getInitializedI18nInstance = (
  translations: SSRConfig,
  defaultNamespace?: string,
) => {
  const { _nextI18Next: nextI18Next } = translations;
  const i18n = createI18nInstance({
    ...nextI18Next?.userConfig,
    lng: nextI18Next?.initialLocale,
    ns: nextI18Next?.ns,
    defaultNS: defaultNamespace ?? false,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    resources: nextI18Next?.initialI18nStore,
  });
  i18n.init();
  return i18n;
};

/**
 * Gets the session ID from the request's cookie.
 * @param req - The request object containing the cookie.
 * @returns The session ID from the cookie, or undefined if not found.
 */
export const getSessionId = (req: { headers: { cookie?: string } }) => {
  if (!req.headers.cookie) {
    return undefined;
  }
  return getCookieValue(SESSION_ID_COOKIE, req.headers.cookie);
};

/**
 * Gets the value of the cookie with the given `cookieName` found in `str`.
 * @param cookieName - The name of the desired cookie.
 * @param str - The string to search for the cookie in, e.g. `document.cookie`.
 * @returns The value of the cookie with the given name, or
 * undefined if no such cookie found in `str`.
 */
export const getCookieValue = (cookieName: string, str: string) => {
  for (const maybeCookie of str.split(";")) {
    const parts = maybeCookie.trim().split("=");
    if (parts[0] === cookieName && parts.length >= 2) {
      const value = parts.slice(1).join("=");
      return decodeURIComponent(value);
    }
  }
  return undefined;
};

/**
 * Gets the time zone contained in the given response's set-cookie header.
 * @param res - The server response object containing the header.
 * @returns The value of the time zone in the set-cookie header, or
 * undefined if the set-cookie header does not set a time zone.
 */
export const getSetCookieTimeZone = (res: ServerResponse) => {
  const setCookieHeader = res.getHeader("set-cookie");
  if (setCookieHeader === undefined || typeof setCookieHeader === "number") {
    return undefined;
  }
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];
  for (const cookie of cookies) {
    const cookieValue = getCookieValue(TIME_ZONE_COOKIE, cookie);
    if (cookieValue !== undefined) {
      return cookieValue;
    }
  }
  return undefined;
};

const locales: Record<string, Locale> = {
  en: enUS,
  ja: ja,
  cn: zhCN,
  tw: zhTW,
  ko: ko,
};

/**
 * Format a date with the given format, locale, and time zone.
 * @param date - The Date object, date string, or timestamp to format.
 * @param dateFormat - The date format pattern to use for formatting.
 * @param localeCode - The code identifying the locale to use for formatting.
 * @param timeZone - The time zone to use for formatting.
 * @returns A formatted date string.
 */
export const formatDate = (
  date: Date | number | string,
  dateFormat: string,
  {
    localeCode = DEFAULT_LOCALE,
    timeZone = "UTC",
  }: { localeCode?: string; timeZone?: string } = {},
): string => {
  const locale = locales[localeCode] ?? enUS;
  return formatInTimeZone(convertToUTCDate(date), timeZone, dateFormat, {
    locale,
  });
};

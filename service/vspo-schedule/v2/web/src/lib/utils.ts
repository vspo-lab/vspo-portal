import { convertToUTCDate } from "@vspo-lab/dayjs";
import type { Locale } from "date-fns";
import { enUS, ja, ko, zhCN, zhTW } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { DEFAULT_LOCALE } from "./Const";
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

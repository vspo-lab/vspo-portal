import { getCurrentUTCDate } from "@vspo-lab/dayjs";

/** Default number of clip items per page. */
export const ITEMS_PER_PAGE = 24;

/**
 * Get the ISO date string for N days ago from the current UTC time.
 * @precondition days >= 0
 * @postcondition Returns a valid ISO date string representing N days before now.
 * @idempotent No - depends on current system time.
 */
const getDaysAgoISO = (days: number): string => {
  const date = getCurrentUTCDate();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

/**
 * Convert a period filter string into the corresponding start date ISO string.
 * @precondition period is one of "day" | "week" | "month" | "year" or any other string.
 * @postcondition Returns an ISO date string for known periods, undefined for unknown.
 * @idempotent No - depends on current system time.
 */
export const getPeriodStartDate = (
  period: string | undefined,
): string | undefined => {
  switch (period) {
    case "day":
      return getDaysAgoISO(1);
    case "week":
      return getDaysAgoISO(7);
    case "month":
      return getDaysAgoISO(30);
    case "year":
      return getDaysAgoISO(365);
    default:
      return undefined;
  }
};

/**
 * Extract a single string value from Next.js search params.
 * Handles the `string | string[] | undefined` shape that Next.js provides.
 * @precondition params is a resolved Next.js searchParams object.
 * @postcondition Returns the first value for the key, or the defaultValue.
 * @idempotent Yes - pure function.
 */
export const getSearchParam = (
  params: Record<string, string | string[] | undefined>,
  key: string,
  defaultValue: string,
): string => {
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? defaultValue;
};

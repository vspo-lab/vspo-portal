import { type NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  DEFAULT_TIME_ZONE,
  LOCALE_COOKIE,
  SESSION_ID_COOKIE,
  TIME_ZONE_COOKIE,
} from "./lib/Const";

const publicFileRegex = /\.(.*)$/;
const locales = ["en", "ja", "cn", "tw", "ko"];

export const middleware = (req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  if (
    pathname.startsWith("/_next") ||
    pathname.includes("/api/") ||
    publicFileRegex.test(pathname)
  ) {
    return;
  }

  const res = NextResponse.next();
  const redirect = setLocale(req, res);
  if (redirect) {
    return redirect;
  }
  setTimeZone(req, res);
  setSessionId(req, res);
  return res;
};

/**
 * Direct response to the first valid locale in:
 * - path prefix
 * - NEXT_LOCALE cookie
 * - Accept-Language header
 * - default app locale
 * and save the locale to the NEXT_LOCALE cookie.
 */
const setLocale = (req: NextRequest, res: NextResponse) => {
  const pathLocale = getPathLocale(req);
  if (pathLocale === undefined) {
    const locale =
      getCookieLocale(req) ?? getHeaderLocale(req) ?? DEFAULT_LOCALE;
    return NextResponse.redirect(createUrlWithLocale(req, locale));
  }
  setCookie(res, LOCALE_COOKIE, pathLocale);
  return undefined;
};

/**
 * Set the time zone cookie to the first valid time zone in:
 * - default app time zone
 */
const setTimeZone = (req: NextRequest, res: NextResponse) => {
  const timeZone = getCookieTimeZone(req) ?? DEFAULT_TIME_ZONE;
  setCookie(res, TIME_ZONE_COOKIE, timeZone);
};

/**
 * Ensure a session ID exists in cookies
 * If none exists, generate a new UUID using crypto
 */
const setSessionId = (req: NextRequest, res: NextResponse) => {
  const existingSessionId = getCookieSessionId(req);
  if (!existingSessionId) {
    const sessionId = crypto.randomUUID();
    setCookie(res, SESSION_ID_COOKIE, sessionId);
  }
};

const getCookieLocale = (req: NextRequest) => {
  return req.cookies.get(LOCALE_COOKIE)?.value;
};

const getPathLocale = (req: NextRequest) => {
  const url = new URL(req.url);
  const localeCandidate = url.pathname.split("/")[1];
  return locales.includes(localeCandidate) ? localeCandidate : undefined;
};

const getHeaderLocale = (req: NextRequest) => {
  const acceptLanguageHeader = req.headers.get("accept-language");
  const headerLocales = acceptLanguageHeader?.split(",").map((part) => {
    return part.trimStart().slice(0, 2);
  });
  return headerLocales?.find((headerLocale) => locales.includes(headerLocale));
};

const getCookieTimeZone = (req: NextRequest) => {
  return req.cookies.get(TIME_ZONE_COOKIE)?.value;
};

/**
 * Get session ID from cookies
 */
export const getCookieSessionId = (req: NextRequest) => {
  return req.cookies.get(SESSION_ID_COOKIE)?.value;
};

const setCookie = (res: NextResponse, name: string, value: string) => {
  res.cookies.set({
    name,
    value,
    path: "/",
    maxAge: 34560000,
  });
};

const createUrlWithLocale = (req: NextRequest, locale: string) => {
  return new URL(
    `/${locale}${req.nextUrl.pathname}${req.nextUrl.search}`,
    req.url,
  );
};

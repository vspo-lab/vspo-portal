import type { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import {
  DEFAULT_TIME_ZONE,
  SESSION_ID_COOKIE,
  TIME_ZONE_COOKIE,
} from "./lib/Const";

const intlMiddleware = createIntlMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  setTimeZone(request, response);
  setSessionId(request, response);
  return response;
}

const setTimeZone = (req: NextRequest, res: NextResponse) => {
  const timeZone =
    req.cookies.get(TIME_ZONE_COOKIE)?.value ?? DEFAULT_TIME_ZONE;
  res.cookies.set({
    name: TIME_ZONE_COOKIE,
    value: timeZone,
    path: "/",
    maxAge: 34560000,
  });
};

const setSessionId = (req: NextRequest, res: NextResponse) => {
  if (!req.cookies.get(SESSION_ID_COOKIE)?.value) {
    res.cookies.set({
      name: SESSION_ID_COOKIE,
      value: crypto.randomUUID(),
      path: "/",
      maxAge: 34560000,
    });
  }
};

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

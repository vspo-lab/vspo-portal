import { AppError, wrap } from "@vspo-lab/error";
import type { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import {
  DEFAULT_TIME_ZONE,
  SESSION_ID_COOKIE,
  TIME_ZONE_COOKIE,
} from "./lib/Const";
import {
  getSessionSecret,
  signSessionId,
  verifySessionId,
} from "./lib/session";

const intlMiddleware = createIntlMiddleware(routing);

const isProd = process.env.NODE_ENV === "production";

/**
 * Only accept IANA time zone names we know the runtime understands.
 * Anything else is silently replaced with the default, so attacker-chosen
 * cookie values cannot flow into `formatInTimeZone` / downstream logs.
 */
const isValidTimeZone = async (tz: string): Promise<boolean> => {
  if (tz.length > 64) return false;
  if (!/^[A-Za-z0-9_\-+/]+$/.test(tz)) return false;

  const validationResult = await wrap(
    Promise.resolve().then(() => {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    }),
    (error) =>
      new AppError({
        message: "Failed to validate time zone cookie.",
        code: "BAD_REQUEST",
        cause: error,
        context: { tz },
      }),
  );

  return !validationResult.err;
};

export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  await setTimeZone(request, response);
  await setSessionId(request, response);
  return response;
}

const setTimeZone = async (req: NextRequest, res: NextResponse) => {
  const raw = req.cookies.get(TIME_ZONE_COOKIE)?.value;
  const timeZone =
    raw && (await isValidTimeZone(raw)) ? raw : DEFAULT_TIME_ZONE;
  res.cookies.set({
    name: TIME_ZONE_COOKIE,
    value: timeZone,
    path: "/",
    maxAge: 34560000,
    sameSite: "lax",
    secure: isProd,
  });
};

const setSessionId = async (req: NextRequest, res: NextResponse) => {
  const secret = getSessionSecret();
  const current = req.cookies.get(SESSION_ID_COOKIE)?.value;
  const verified = await verifySessionId(current, secret);

  if (!verified) {
    const uuid = crypto.randomUUID();
    const signed = await signSessionId(uuid, secret);
    res.cookies.set({
      name: SESSION_ID_COOKIE,
      value: signed,
      path: "/",
      maxAge: 34560000,
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
    });
  }
};

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

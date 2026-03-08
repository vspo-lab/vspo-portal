import type { AppError, Result } from "@vspo-lab/error";
import { Ok } from "@vspo-lab/error";
import type { SessionType } from "../domain/session";
import { Session } from "../domain/session";

const COOKIE_NAME = "__session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** HMAC-SHA256 署名を生成する */
const sign = async (data: string, secret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

/** HMAC-SHA256 署名を検証する (constant-time comparison via Web Crypto) */
const verify = async (
  data: string,
  signature: string,
  secret: string,
): Promise<boolean> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  return crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(data));
};

/**
 * Cookie ベースのセッションストア (HMAC-SHA256 署名)
 * @precondition SESSION_SECRET が設定されていること
 * @idempotency セッション読み取りは冪等、書き込みは Set-Cookie ヘッダーで反映
 */
const SessionStore = {
  /** リクエストからセッションを読み取る */
  get: async (
    request: Request,
    secret: string,
  ): Promise<Result<SessionType | null, AppError>> => {
    const cookie = request.headers.get("Cookie");
    if (!cookie) return Ok(null);

    const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (!match?.[1]) return Ok(null);

    try {
      const decoded = atob(match[1]);
      const payload = JSON.parse(decoded) as {
        data: SessionType;
        sig: string;
      };

      const dataStr = JSON.stringify(payload.data);
      const isValid = await verify(dataStr, payload.sig, secret);
      if (!isValid) return Ok(null);

      const parsed = Session.schema.safeParse(payload.data);
      if (!parsed.success) return Ok(null);

      if (Session.isExpired(parsed.data)) return Ok(null);

      return Ok(parsed.data);
    } catch {
      return Ok(null);
    }
  },

  /** セッションを Set-Cookie ヘッダーとして生成する */
  create: async (session: SessionType, secret: string): Promise<string> => {
    const data = JSON.stringify(session);
    const sig = await sign(data, secret);
    const value = btoa(JSON.stringify({ data: session, sig }));

    return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
  },

  /** セッションを破棄する Set-Cookie ヘッダーを生成する */
  destroy: (): string => {
    return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  },
} as const;

export { SessionStore };

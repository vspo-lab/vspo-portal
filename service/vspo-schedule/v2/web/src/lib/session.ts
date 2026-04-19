/**
 * Session ID cookie utilities (HMAC-signed, HttpOnly, Secure, SameSite=Lax).
 *
 * The cookie value format is `<uuid>.<hex(hmac)>` where:
 *   - `uuid` is a v4 UUID generated on first request.
 *   - `hmac` is HMAC-SHA256(uuid) using `SESSION_COOKIE_SECRET`.
 *
 * If the cookie is tampered with (e.g. a client rewrites the UUID) the
 * signature check fails, we discard the value, and issue a fresh session ID.
 *
 * @precondition `SESSION_COOKIE_SECRET` env var is set at runtime.
 * @postcondition `verifySessionId` returns `null` for any invalid/tampered value.
 * @idempotent `sign` is deterministic for the same uuid+secret.
 */

const encoder = new TextEncoder();

const importKey = async (secret: string): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
};

const toHex = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
};

export const signSessionId = async (
  uuid: string,
  secret: string,
): Promise<string> => {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(uuid));
  return `${uuid}.${toHex(sig)}`;
};

export const verifySessionId = async (
  value: string | undefined,
  secret: string,
): Promise<string | null> => {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const uuid = value.slice(0, dot);
  const hex = value.slice(dot + 1);
  if (!/^[0-9a-f-]{36}$/i.test(uuid) || !/^[0-9a-f]{64}$/i.test(hex)) {
    return null;
  }
  const expected = await signSessionId(uuid, secret);
  if (expected.length !== value.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ value.charCodeAt(i);
  }
  return diff === 0 ? uuid : null;
};

export const getSessionSecret = (): string => {
  const s = process.env.SESSION_COOKIE_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "SESSION_COOKIE_SECRET is missing or too short (min 32 chars).",
    );
  }
  return s;
};

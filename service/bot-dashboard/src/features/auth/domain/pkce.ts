/**
 * PKCE (Proof Key for Code Exchange) helpers for Discord OAuth2.
 *
 * @precondition Web Crypto API must be available (Cloudflare Workers, modern browsers).
 * @postcondition Generated verifier/challenge pair satisfies RFC 7636 S256 method.
 */

/**
 * Generates a cryptographically random code verifier (43-128 chars, URL-safe).
 *
 * @returns A 43-character base64url-encoded random string
 */
const generateCodeVerifier = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
};

/**
 * Derives a code challenge from a code verifier using SHA-256.
 *
 * @param verifier - The code verifier to hash
 * @returns base64url-encoded SHA-256 hash of the verifier
 */
const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
};

const base64UrlEncode = (bytes: Uint8Array): string => {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const PKCE = {
  generateCodeVerifier,
  generateCodeChallenge,
} as const;

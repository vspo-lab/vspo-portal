import "server-only";
import { AppError } from "@vspo-lab/error";

/**
 * Returns the API_URL_V2 base URL used by the HTTP fallback path (`VSPOApi`).
 *
 * @precondition `API_URL_V2` env var must be set to a full HTTPS origin in all
 * non-local environments. The previous implementation silently fell back to
 * `http://localhost:3000`, which is exploitable if the variable is unset in
 * production.
 * @postcondition Returns a non-empty string. Throws `AppError` otherwise so the
 * server component fails closed instead of leaking requests to localhost.
 * @idempotent Yes - reads an env var.
 */
export const getApiBaseUrl = (): string => {
  const url = process.env.API_URL_V2;
  if (!url || url.length === 0) {
    throw new AppError({
      message:
        "API_URL_V2 env var is not configured. Refusing to fall back to localhost.",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
  return url;
};

import { AppError, Ok, type Result, wrap } from "@vspo-lab/error";
import type { z } from "zod";

/**
 * Parses JSON text and validates the parsed value with the given Zod schema.
 * @precondition `raw` is a UTF-8 JSON string candidate and `schema` is a valid Zod schema.
 * @postcondition Returns `Ok(validatedValue)` when both JSON parse and schema validation succeed, otherwise returns `Ok(null)`.
 * @idempotent Yes - for the same `raw` and `schema`, this function returns the same `val`.
 */
export const safeParseJson = async <T>(
  raw: string,
  schema: z.ZodType<T>,
): Promise<Result<T | null, never>> => {
  const parsedResult = await wrap(
    Promise.resolve().then(() => JSON.parse(raw)),
    (error) =>
      new AppError({
        message: "Failed to parse JSON text.",
        code: "BAD_REQUEST",
        cause: error,
        context: { raw },
      }),
  );

  if (parsedResult.err) {
    return Ok(null);
  }

  const validated = schema.safeParse(parsedResult.val);
  return Ok(validated.success ? validated.data : null);
};

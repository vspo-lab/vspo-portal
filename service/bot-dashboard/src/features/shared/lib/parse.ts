import type { Result } from "@vspo-lab/error";
import { AppError, Err, Ok } from "@vspo-lab/error";
import type { z } from "zod";

/**
 * Safely parse unknown values with a Zod schema and return as Result type
 * @postcondition Returns Ok(data) on successful parse, Err(AppError) on failure
 */
export const parseResult = <T>(
  schema: z.ZodType<T>,
  raw: unknown,
): Result<T, AppError> => {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return Err(
      new AppError({ message: parsed.error.message, code: "BAD_REQUEST" }),
    );
  }
  return Ok(parsed.data);
};

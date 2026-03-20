import type { Result } from "@vspo-lab/error";
import { AppError, Err, Ok } from "@vspo-lab/error";
import type { z } from "zod";

/**
 * Zod スキーマで unknown を安全にパースし、Result 型で返す
 * @postcondition パース成功なら Ok(data)、失敗なら Err(AppError) を返す
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

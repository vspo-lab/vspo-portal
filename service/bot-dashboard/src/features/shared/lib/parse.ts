import type { Result } from "@vspo-lab/error";
import { AppError, Err, Ok } from "@vspo-lab/error";
import { z } from "zod";

/**
 * Zod スキーマで unknown を安全にパースし、Result 型で返す
 * @postcondition パース成功なら Ok(data)、失敗なら Err(AppError) を返す
 */
const parseResult = <T>(
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

/**
 * JSON.parse を安全にラップし、Result 型で返す
 * @postcondition パース成功なら Ok(parsed)、失敗なら Err(AppError) を返す
 */
const safeJsonParse = (input: string): Result<unknown, AppError> => {
  const result = z
    .string()
    .transform((s, ctx) => {
      try {
        return JSON.parse(s) as unknown;
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON" });
        return z.NEVER;
      }
    })
    .safeParse(input);
  if (!result.success) {
    return Err(
      new AppError({ message: result.error.message, code: "BAD_REQUEST" }),
    );
  }
  return Ok(result.data);
};

export { parseResult, safeJsonParse };

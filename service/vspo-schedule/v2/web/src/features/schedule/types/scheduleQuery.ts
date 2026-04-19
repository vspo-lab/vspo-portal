import { z } from "zod";

/**
 * Schema for parsing untrusted `searchParams` of schedule pages.
 *
 * @precondition `input` originates from Next.js `searchParams` which is always
 * `Record<string, string | string[] | undefined>`.
 * @postcondition Returns normalized primitives. Unknown/invalid values are
 * coerced to `undefined` so the downstream RPC never receives attacker input.
 * @idempotent Yes - same input yields same output.
 */
export const scheduleSearchParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(300).optional().catch(undefined),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
  memberType: z
    .enum(["vspo_jp", "vspo_en", "vspo_ch", "vspo_all", "general"])
    .optional()
    .catch(undefined),
  platform: z
    .enum(["youtube", "twitch", "twitcasting", "niconico"])
    .optional()
    .catch(undefined),
});

const scheduleStatusSchema = z.enum(["all", "live", "upcoming", "archive"]);

/**
 * @precondition `raw` is the raw schedule status path segment.
 * @postcondition Returns a known status or "all" as a safe default.
 * @idempotent Yes.
 */
export const normalizeScheduleStatus = (
  raw: string,
): z.infer<typeof scheduleStatusSchema> => {
  const parsed = scheduleStatusSchema.safeParse(raw);
  return parsed.success ? parsed.data : "all";
};

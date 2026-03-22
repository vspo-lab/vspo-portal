import type { AppError, Result } from "@vspo-lab/error";
import { z } from "zod";
import { parseResult } from "../lib/parse";

const CreatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  memberType: z.enum(["vspo_jp", "vspo_en"]),
  thumbnailUrl: z.string().nullable(),
});

type Creator = z.infer<typeof CreatorSchema>;

const Creator = {
  schema: CreatorSchema,

  /**
   * Parses a creator API response into domain creator models.
   *
   * @param raw - Unknown API payload expected to contain an array of creators
   * @returns Parsed creator array, or an AppError when validation fails
   * @precondition raw is compatible with `CreatorSchema[]` or the caller handles Err
   * @postcondition On Ok, every element in return.val satisfies Creator.schema
   */
  fromApiResponse: (raw: unknown): Result<Creator[], AppError> =>
    parseResult(z.array(CreatorSchema), raw),

  /** Filters creators by member type. */
  filterByType: (
    creators: readonly Creator[],
    type: "vspo_jp" | "vspo_en",
  ): Creator[] => creators.filter((c) => c.memberType === type),

  /** Filters creators by a set of creator IDs. */
  filterByIds: (
    creators: readonly Creator[],
    ids: ReadonlySet<string>,
  ): Creator[] => creators.filter((c) => ids.has(c.id)),
} as const;

export { Creator, type Creator as CreatorType };

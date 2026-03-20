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

  fromApiResponse: (raw: unknown): Result<Creator[], AppError> =>
    parseResult(z.array(CreatorSchema), raw),

  filterByType: (
    creators: readonly Creator[],
    type: "vspo_jp" | "vspo_en",
  ): Creator[] => creators.filter((c) => c.memberType === type),

  filterByIds: (
    creators: readonly Creator[],
    ids: ReadonlySet<string>,
  ): Creator[] => creators.filter((c) => ids.has(c.id)),
} as const;

export { Creator, type Creator as CreatorType };

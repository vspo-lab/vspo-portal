import { z } from "zod";

const MemberTypeSchema = z.enum(["vspo_jp", "vspo_en", "all", "custom"]);

type MemberType = z.infer<typeof MemberTypeSchema>;

const MemberType = {
  schema: MemberTypeSchema,

  /** カスタムメンバー選択が必要か */
  requiresCustomSelection: (mt: MemberType): boolean => mt === "custom",
} as const;

export { MemberType, type MemberType as MemberTypeValue };

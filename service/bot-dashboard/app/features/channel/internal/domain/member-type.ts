import { z } from "zod";

const MemberTypeSchema = z.enum(["vspo_jp", "vspo_en", "all", "custom"]);

type MemberType = z.infer<typeof MemberTypeSchema>;

const MemberType = {
  schema: MemberTypeSchema,

  /** 表示ラベルを返す */
  label: (mt: MemberType): string =>
    ({
      vspo_jp: "VSPO JP",
      vspo_en: "VSPO EN",
      all: "All Members",
      custom: "Custom",
    })[mt],

  /** カスタムメンバー選択が必要か */
  requiresCustomSelection: (mt: MemberType): boolean => mt === "custom",

  /** 選択肢の一覧を返す */
  options: (): { value: MemberType; label: string }[] =>
    MemberTypeSchema.options.map((value) => ({
      value,
      label: MemberType.label(value),
    })),
} as const;

export { MemberType, type MemberType as MemberTypeValue };

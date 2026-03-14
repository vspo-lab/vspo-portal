import { type Result, AppError, Err } from "@vspo-lab/error";
import { z } from "zod";
import { parseResult } from "~/features/shared/lib/parse";
import { MemberType } from "./member-type";

const ChannelConfigSchema = z.object({
  channelId: z.string(),
  channelName: z.string(),
  enabled: z.boolean(),
  language: z.string(),
  memberType: MemberType.schema,
  customMembers: z.array(z.string()).optional(),
});

type ChannelConfig = z.infer<typeof ChannelConfigSchema>;

const ChannelConfig = {
  schema: ChannelConfigSchema,

  fromApiResponse: (raw: unknown): Result<ChannelConfig, AppError> =>
    parseResult(ChannelConfigSchema, raw),

  /** デフォルト設定を生成する */
  defaultFor: (channelId: string, channelName: string): ChannelConfig => ({
    channelId,
    channelName,
    enabled: true,
    language: "ja",
    memberType: "all",
    customMembers: undefined,
  }),

  /** FormData からバリデーション付きで変換する */
  fromFormData: (
    formData: FormData,
  ): Result<
    Pick<ChannelConfig, "language" | "memberType" | "customMembers">,
    AppError
  > => {
    const schema = ChannelConfigSchema.pick({
      language: true,
      memberType: true,
      customMembers: true,
    });
    const rawCustomMembers = (formData.get("customMembers") as string) || "[]";
    let customMembers: unknown;
    try {
      customMembers = JSON.parse(rawCustomMembers);
    } catch {
      return Err(
        new AppError({
          message: "customMembers is invalid JSON",
          code: "BAD_REQUEST",
        }),
      );
    }
    return parseResult(schema, {
      language: formData.get("language"),
      memberType: formData.get("memberType"),
      customMembers,
    });
  },
} as const;

export { ChannelConfig, type ChannelConfig as ChannelConfigType };

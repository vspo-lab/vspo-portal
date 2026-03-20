import { z } from "zod";
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
} as const;

export { ChannelConfig, type ChannelConfig as ChannelConfigType };

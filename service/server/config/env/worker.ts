import { z } from "zod";
import type {
  ClipAnalysisQueryService,
  ClipCommandService,
  ClipQueryService,
  CreatorCommandService,
  CreatorQueryService,
  DiscordCommandService,
  DiscordQueryService,
  EventCommandService,
  EventQueryService,
  FreechatQueryService,
  StreamCommandService,
  StreamQueryService,
} from "../../cmd/server/internal/application";
import { zCommonEnv } from "./common";
import { zFeatureFlagEnv } from "./flag";
export const zBindingAppWorkerEnv = z
  .object({
    APP_KV: z.custom<KVNamespace>(),
    // CQRS Query Services
    STREAM_QUERY_SERVICE: z.custom<Service<StreamQueryService>>(),
    CLIP_QUERY_SERVICE: z.custom<Service<ClipQueryService>>(),
    CREATOR_QUERY_SERVICE: z.custom<Service<CreatorQueryService>>(),
    DISCORD_QUERY_SERVICE: z.custom<Service<DiscordQueryService>>(),
    EVENT_QUERY_SERVICE: z.custom<Service<EventQueryService>>(),
    FREECHAT_QUERY_SERVICE: z.custom<Service<FreechatQueryService>>(),
    CLIP_ANALYSIS_QUERY_SERVICE: z.custom<Service<ClipAnalysisQueryService>>(),
    // CQRS Command Services
    STREAM_COMMAND_SERVICE: z.custom<Service<StreamCommandService>>(),
    CLIP_COMMAND_SERVICE: z.custom<Service<ClipCommandService>>(),
    CREATOR_COMMAND_SERVICE: z.custom<Service<CreatorCommandService>>(),
    DISCORD_COMMAND_SERVICE: z.custom<Service<DiscordCommandService>>(),
    EVENT_COMMAND_SERVICE: z.custom<Service<EventCommandService>>(),
  })
  .merge(zCommonEnv)
  .merge(zFeatureFlagEnv);

export type BindingAppWorkerEnv = z.infer<typeof zBindingAppWorkerEnv>;

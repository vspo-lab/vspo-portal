import { z } from "zod";
import { zFeatureFlagEnv } from "./flag";
export const zBindingWorkflowEnv = z
  .object({
    SEARCH_STREAMS_WORKFLOW: z.custom<Workflow>(),
    SEARCH_CHANNELS_WORKFLOW: z.custom<Workflow>(),
    TRANSLATE_STREAMS_WORKFLOW: z.custom<Workflow>(),
    TRANSLATE_CREATORS_WORKFLOW: z.custom<Workflow>(),
    DISCORD_SEND_MESSAGES_WORKFLOW: z.custom<Workflow>(),
    SEARCH_MEMBER_STREAMS_BY_CHANNEL_WORKFLOW: z.custom<Workflow>(),
    DELETE_STREAMS_WORKFLOW: z.custom<Workflow>(),
    DISCORD_DELETE_ALL_WORKFLOW: z.custom<Workflow>(),
    DISCORD_SEND_MESSAGE_ALL_CHANNEL_WORKFLOW: z.custom<Workflow>(),
    DISCORD_SEND_MESSAGE_CHANNELS_WORKFLOW: z.custom<Workflow>(),
    EXIST_CLIPS_WORKFLOW: z.custom<Workflow>(),
    SEARCH_CLIPS_WORKFLOW: z.custom<Workflow>(),
    SEARCH_CLIPS_BY_VSPO_MEMBER_NAME_WORKFLOW: z.custom<Workflow>(),
    ACCESS_VSPO_SCHEDULE_SITE_WORKFLOW: z.custom<Workflow>(),
    FETCH_CLIPS_BY_CREATOR_WORKFLOW: z.custom<Workflow>(),
  })
  .merge(zFeatureFlagEnv);
export type BindingWorkflowEnv = z.infer<typeof zBindingWorkflowEnv>;

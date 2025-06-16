import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { AppLogger } from "@vspo-lab/logging";
import type { BindingAppWorkerEnv } from "../../config/env/worker";
import type { BindingWorkflowEnv } from "../../config/env/workflow";
import { setFeatureFlagProvider } from "../../config/featureFlag";
import { createHandler, withTracer } from "../../infra/http/trace";
import { searchChannelsWorkflow } from "../../infra/http/workflow/channel/search";
import { translateCreatorsWorkflow } from "../../infra/http/workflow/channel/trasnlate";
import { existClipsWorkflow } from "../../infra/http/workflow/clip/exist";
import {
  type FetchClipsByCreatorParams,
  fetchClipsByCreatorWorkflow,
} from "../../infra/http/workflow/clip/fetchByCreator";
import {
  searchClipsByVspoMemberNameWorkflow,
  searchClipsWorkflow,
} from "../../infra/http/workflow/clip/search";
import { discordDeleteAllWorkflow } from "../../infra/http/workflow/discord/deleteAll";
import { discordSendMessagesWorkflow } from "../../infra/http/workflow/discord/send";
import {
  type DiscordSendMessageAllChannelParams,
  discordSendMessageAllChannelWorkflow,
} from "../../infra/http/workflow/discord/sendMessageAllChannel";
import {
  type DiscordSendMessageChannelsParams,
  discordSendMessageChannelsWorkflow,
} from "../../infra/http/workflow/discord/sendMessageChannels";
import { deleteStreamsWorkflow } from "../../infra/http/workflow/stream/delete";
import { searchStreamsWorkflow } from "../../infra/http/workflow/stream/search";
import { searchMemberStreamsByChannelWorkflow } from "../../infra/http/workflow/stream/searchMemberStreamByChannel";
import { translateStreamsWorkflow } from "../../infra/http/workflow/stream/trasnlate";
import { accessVspoScheduleSiteWorkflow } from "../../infra/http/workflow/web/access";
import { createUUID } from "../../pkg/uuid";

export class SearchChannelsWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  Params
> {
  async run(_event: WorkflowEvent<Params>, step: WorkflowStep) {
    await setFeatureFlagProvider(this.env);
    await searchChannelsWorkflow().handler()(this.env, _event, step);
  }
}

export class SearchStreamsWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  Params
> {
  async run(_event: WorkflowEvent<Params>, step: WorkflowStep) {
    await setFeatureFlagProvider(this.env);
    await searchStreamsWorkflow().handler()(this.env, _event, step);
  }
}

export class TranslateCreatorsWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  Params
> {
  async run(_event: WorkflowEvent<Params>, step: WorkflowStep) {
    await setFeatureFlagProvider(this.env);
    await translateCreatorsWorkflow().handler()(this.env, _event, step);
  }
}

export class TranslateStreamsWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  Params
> {
  async run(_event: WorkflowEvent<Params>, step: WorkflowStep) {
    await setFeatureFlagProvider(this.env);
    await translateStreamsWorkflow().handler()(this.env, _event, step);
  }
}

export class DiscordSendMessagesWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  Params
> {
  async run(_event: WorkflowEvent<Params>, step: WorkflowStep) {
    await setFeatureFlagProvider(this.env);
    await discordSendMessagesWorkflow().handler()(this.env, _event, step);
  }
}

export class SearchMemberStreamsByChannelWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  Params
> {
  async run(_event: WorkflowEvent<Params>, step: WorkflowStep) {
    await setFeatureFlagProvider(this.env);
    await searchMemberStreamsByChannelWorkflow().handler()(
      this.env,
      _event,
      step,
    );
  }
}

export class DeleteStreamsWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  Params
> {
  async run(_event: WorkflowEvent<Params>, step: WorkflowStep) {
    await setFeatureFlagProvider(this.env);
    await deleteStreamsWorkflow().handler()(this.env, _event, step);
  }
}

export class DiscordDeleteAllWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  Params
> {
  async run(_event: WorkflowEvent<Params>, step: WorkflowStep) {
    await setFeatureFlagProvider(this.env);
    await discordDeleteAllWorkflow().handler()(this.env, _event, step);
  }
}

export class DiscordSendMessageAllChannelWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  DiscordSendMessageAllChannelParams
> {
  async run(
    event: WorkflowEvent<DiscordSendMessageAllChannelParams>,
    step: WorkflowStep,
  ) {
    await setFeatureFlagProvider(this.env);
    await discordSendMessageAllChannelWorkflow().handler()(
      this.env,
      event,
      step,
    );
  }
}

export class DiscordSendMessageChannelsWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  DiscordSendMessageChannelsParams
> {
  async run(
    event: WorkflowEvent<DiscordSendMessageChannelsParams>,
    step: WorkflowStep,
  ) {
    await setFeatureFlagProvider(this.env);
    await discordSendMessageChannelsWorkflow().handler()(this.env, event, step);
  }
}

export class ExistClipsWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  Params
> {
  async run(_event: WorkflowEvent<Params>, step: WorkflowStep) {
    await setFeatureFlagProvider(this.env);
    await existClipsWorkflow().handler()(this.env, _event, step);
  }
}

export class SearchClipsWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  Params
> {
  async run(_event: WorkflowEvent<Params>, step: WorkflowStep) {
    await setFeatureFlagProvider(this.env);
    await searchClipsWorkflow().handler()(this.env, _event, step);
  }
}

export class SearchClipsByVspoMemberNameWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  Params
> {
  async run(_event: WorkflowEvent<Params>, step: WorkflowStep) {
    await setFeatureFlagProvider(this.env);
    await searchClipsByVspoMemberNameWorkflow().handler()(
      this.env,
      _event,
      step,
    );
  }
}

export class AccessVspoScheduleSiteWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  Params
> {
  async run(_event: WorkflowEvent<Params>, step: WorkflowStep) {
    await setFeatureFlagProvider(this.env);
    await accessVspoScheduleSiteWorkflow().handler()(this.env, _event, step);
  }
}

export class FetchClipsByCreatorWorkflow extends WorkflowEntrypoint<
  BindingAppWorkerEnv,
  FetchClipsByCreatorParams
> {
  async run(
    event: WorkflowEvent<FetchClipsByCreatorParams>,
    step: WorkflowStep,
  ) {
    await setFeatureFlagProvider(this.env);
    await fetchClipsByCreatorWorkflow().handler()(this.env, event, step);
  }
}

export default createHandler({
  scheduled: async (
    controller: ScheduledController,
    env: BindingWorkflowEnv,
    ctx: ExecutionContext,
  ) => {
    return await withTracer("ScheduledHandler", "scheduled", async (span) => {
      span.setAttribute("cron", controller.cron);
      await setFeatureFlagProvider(env);
      switch (controller.cron) {
        case "0 0,7,18 * * *":
          await withTracer(
            "CronJob",
            "search-channels",
            async (searchChannelsSpan) => {
              AppLogger.info("search-channels");
              searchChannelsSpan.setAttribute("workflow", "search-channels");
              await env.SEARCH_CHANNELS_WORKFLOW.create({ id: createUUID() });
            },
          );
          break;
        case "5 0,7,18 * * *":
          await withTracer(
            "CronJob",
            "translate-creators",
            async (translateCreatorsSpan) => {
              AppLogger.info("translate-creators");
              translateCreatorsSpan.setAttribute(
                "workflow",
                "translate-creators",
              );
              await env.TRANSLATE_CREATORS_WORKFLOW.create({
                id: createUUID(),
              });
            },
          );
          break;
        case "*/1 * * * *":
          await withTracer(
            "CronJob",
            "search-streams",
            async (searchStreamsSpan) => {
              AppLogger.info("search-streams");
              searchStreamsSpan.setAttribute("workflow", "search-streams");
              await env.SEARCH_STREAMS_WORKFLOW.create({ id: createUUID() });
              await env.ACCESS_VSPO_SCHEDULE_SITE_WORKFLOW.create({
                id: createUUID(),
              });
            },
          );
          break;
        case "*/2 * * * *":
          await withTracer(
            "CronJob",
            "discord-send-messages",
            async (discordSpan) => {
              AppLogger.info("discord-send-messages");
              discordSpan.setAttribute("workflow", "discord-send-messages");
              await env.TRANSLATE_STREAMS_WORKFLOW.create({ id: createUUID() });
              await env.DISCORD_SEND_MESSAGES_WORKFLOW.create({
                id: createUUID(),
              });
            },
          );
          break;
        case "*/30 * * * *":
          await withTracer(
            "CronJob",
            "search-member-streams-by-channel",
            async (memberStreamsSpan) => {
              AppLogger.info("search-member-streams-by-channel");
              memberStreamsSpan.setAttribute(
                "workflow",
                "search-member-streams-by-channel",
              );
              await env.SEARCH_MEMBER_STREAMS_BY_CHANNEL_WORKFLOW.create({
                id: createUUID(),
              });
              await env.DELETE_STREAMS_WORKFLOW.create({ id: createUUID() });
            },
          );
          break;
        case "15 * * * *":
          await withTracer("CronJob", "clips-hourly", async (clipsSpan) => {
            AppLogger.info("exist-clips");
            clipsSpan.setAttribute("workflow", "clips-hourly");
            await env.EXIST_CLIPS_WORKFLOW.create({ id: createUUID() });
            await env.SEARCH_CLIPS_WORKFLOW.create({ id: createUUID() });
          });
          break;
        case "30 21 * * *":
          await withTracer(
            "CronJob",
            "search-clips-by-vspo-member-name",
            async (vspoClipsSpan) => {
              AppLogger.info("search-clips-by-vspo-member-name");
              vspoClipsSpan.setAttribute(
                "workflow",
                "search-clips-by-vspo-member-name",
              );
              await env.SEARCH_CLIPS_BY_VSPO_MEMBER_NAME_WORKFLOW.create({
                id: createUUID(),
              });
            },
          );
          break;
        case "0 */12 * * *":
          await withTracer(
            "CronJob",
            "fetch-clips-by-creator",
            async (creatorClipsSpan) => {
              AppLogger.info("fetch-clips-by-creator");
              creatorClipsSpan.setAttribute(
                "workflow",
                "fetch-clips-by-creator",
              );
              await env.FETCH_CLIPS_BY_CREATOR_WORKFLOW.create({
                id: createUUID(),
                params: {
                  batchSize: 300,
                  maxQuotaUsage: 10000,
                },
              });
            },
          );
          break;
        default:
          console.error("Unknown cron", controller.cron);
          break;
      }
    });
  },
});

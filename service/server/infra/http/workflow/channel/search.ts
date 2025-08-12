import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { AppLogger } from "@vspo-lab/logging";
import {
  type BindingAppWorkerEnv,
  zBindingAppWorkerEnv,
} from "../../../../config/env/worker";
import { withTracer } from "../../../http/trace/cloudflare";

export const searchChannelsWorkflow = () => {
  return {
    handler:
      () =>
      async (
        env: BindingAppWorkerEnv,
        _event: WorkflowEvent<Params>,
        step: WorkflowStep,
      ) => {
        const e = zBindingAppWorkerEnv.safeParse(env);
        if (!e.success) {
          console.error(e.error.message);
          return;
        }
        const logger = AppLogger.getInstance(e.data);
        const results = await Promise.allSettled([
          step.do(
            "fetch and send vspo_jp channels",
            {
              retries: { limit: 3, delay: "5 second", backoff: "linear" },
              timeout: "1 minutes",
            },
            async () => {
              return withTracer(
                "channel-workflow",
                "fetch-vspo-jp-channels",
                async (span) => {
                  const queryService = env.CREATOR_QUERY_SERVICE;
                  const commandService = env.CREATOR_COMMAND_SERVICE;
                  const result = await queryService.searchByMemberType({
                    memberType: "vspo_jp",
                  });
                  if (result.err) {
                    throw result.err;
                  }
                  if (result.val.length === 0) {
                    return;
                  }
                  span.setAttribute("channels_count", result.val.length);
                  const _ = await commandService.batchUpsertEnqueue(result.val);
                },
              );
            },
          ),
          step.do(
            "fetch and send vspo_en channels",
            {
              retries: { limit: 3, delay: "5 second", backoff: "linear" },
              timeout: "1 minutes",
            },
            async () => {
              return withTracer(
                "channel-workflow",
                "fetch-vspo-en-channels",
                async (span) => {
                  const queryService = env.CREATOR_QUERY_SERVICE;
                  const commandService = env.CREATOR_COMMAND_SERVICE;
                  const result = await queryService.searchByMemberType({
                    memberType: "vspo_en",
                  });
                  if (result.err) {
                    throw result.err;
                  }
                  if (result.val.length === 0) {
                    return;
                  }
                  span.setAttribute("channels_count", result.val.length);
                  const _ = await commandService.batchUpsertEnqueue(result.val);
                },
              );
            },
          ),
        ]);

        const failedSteps = results.filter(
          (result) => result.status === "rejected",
        );
        if (failedSteps.length > 0) {
          logger.error(
            `${failedSteps.length} step(s) failed. Check logs for details.`,
          );
        }
      },
  };
};

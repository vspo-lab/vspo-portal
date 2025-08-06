import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { AppLogger } from "@vspo-lab/logging";
import {
  type BindingAppWorkerEnv,
  zBindingAppWorkerEnv,
} from "../../../../config/env/worker";
import { withTracer } from "../../trace/cloudflare";

export const searchStreamsWorkflow = () => {
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
            "fetch and send live videos",
            {
              retries: { limit: 3, delay: "5 second", backoff: "linear" },
              timeout: "1 minutes",
            },
            async () => {
              return withTracer(
                "stream-workflow",
                "search-live-streams",
                async (span) => {
                  const result = await env.STREAM_QUERY_SERVICE.searchLive();
                  if (result.err) {
                    throw result.err;
                  }
                  if (result.val.length === 0) {
                    span.setAttribute("videos_count", 0);
                    return;
                  }
                  span.setAttribute("videos_count", result.val.length);
                  const _ = await env.STREAM_COMMAND_SERVICE.batchUpsertEnqueue(
                    result.val,
                  );
                },
              );
            },
          ),
          step.do(
            "fetch and send existing videos",
            {
              retries: { limit: 3, delay: "5 second", backoff: "linear" },
              timeout: "1 minutes",
            },
            async () => {
              return withTracer(
                "stream-workflow",
                "search-existing-streams",
                async (span) => {
                  const result = await env.STREAM_QUERY_SERVICE.searchExist();
                  if (result.err) {
                    throw result.err;
                  }
                  if (result.val.length === 0) {
                    span.setAttribute("videos_count", 0);
                    return;
                  }
                  span.setAttribute("videos_count", result.val.length);
                  const _ = await env.STREAM_COMMAND_SERVICE.batchUpsertEnqueue(
                    result.val,
                  );
                },
              );
            },
          ),
          step.do(
            "fetch and send deleted videos",
            {
              retries: { limit: 1, delay: "5 second", backoff: "linear" },
              timeout: "1 minutes",
            },
            async () => {
              return withTracer(
                "stream-workflow",
                "search-deleted-streams",
                async (span) => {
                  const result =
                    await env.STREAM_QUERY_SERVICE.searchDeletedCheck();
                  if (result.err) {
                    throw result.err;
                  }
                  if (result.val.length === 0) {
                    span.setAttribute("videos_count", 0);
                    return;
                  }
                  span.setAttribute("videos_count", result.val.length);
                  const _ = await env.STREAM_COMMAND_SERVICE.batchUpsertEnqueue(
                    result.val,
                  );
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

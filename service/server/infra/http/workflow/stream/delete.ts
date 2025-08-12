import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { AppLogger } from "@vspo-lab/logging";
import {
  type BindingAppWorkerEnv,
  zBindingAppWorkerEnv,
} from "../../../../config/env/worker";
import { withTracer } from "../../trace/cloudflare";

export const deleteStreamsWorkflow = () => {
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
            "fetch and delete deleted videos",
            {
              retries: { limit: 1, delay: "5 second", backoff: "linear" },
              timeout: "1 minutes",
            },
            async () => {
              return withTracer(
                "stream-workflow",
                "delete-deleted-streams",
                async (span) => {
                  const result =
                    await env.STREAM_QUERY_SERVICE.deletedListIds();
                  if (result.err) {
                    throw result.err;
                  }
                  AppLogger.debug("after deletedListIds", {
                    streamIds: result.val,
                  });
                  if (result.val.length === 0) {
                    span.setAttribute("videos_count", 0);
                    return;
                  }
                  AppLogger.debug("batchDeleteByVideoIds", {
                    streamIds: result.val,
                  });
                  span.setAttribute("videos_count", result.val.length);
                  const _ =
                    await env.STREAM_COMMAND_SERVICE.batchDeleteByStreamIds({
                      streamIds: result.val,
                    });
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

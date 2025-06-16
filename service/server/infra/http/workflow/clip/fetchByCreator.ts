import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { AppLogger } from "@vspo-lab/logging";
import {
  type BindingAppWorkerEnv,
  zBindingAppWorkerEnv,
} from "../../../../config/env/worker";
import { withTracer } from "../../trace/cloudflare";

export interface FetchClipsByCreatorParams {
  batchSize?: number;
  memberType?: string;
}

export const fetchClipsByCreatorWorkflow = () => {
  return {
    handler:
      () =>
      async (
        env: BindingAppWorkerEnv,
        event: WorkflowEvent<FetchClipsByCreatorParams>,
        step: WorkflowStep,
      ) => {
        const e = zBindingAppWorkerEnv.safeParse(env);
        if (!e.success) {
          console.error(e.error.message);
          return;
        }

        const params = event.payload || {};

        await step.do(
          "fetch clips by creator",
          {
            retries: { limit: 1, delay: "30 second", backoff: "exponential" },
            timeout: "10 minutes",
          },
          async () => {
            return withTracer(
              "clip-workflow",
              "fetch-clips-by-creator",
              async (span) => {
                const cu = await env.APP_WORKER.newClipUsecase();
                const ccfu = await env.APP_WORKER.newCreatorClipFetchUsecase();

                // Fetch clips for creators
                const result = await ccfu.fetchClipsByCreator({
                  batchSize: params.batchSize,
                  memberType: params.memberType,
                });

                if (result.err) {
                  AppLogger.error("Failed to fetch clips by creator", {
                    error: result.err,
                    params,
                  });
                  throw result.err;
                }

                const { clips, processedCreatorCount, hasMore } = result.val;

                span.setAttribute("clips_count", clips.length);
                span.setAttribute("processed_creators", processedCreatorCount);
                span.setAttribute("has_more", hasMore);

                AppLogger.info("Fetched clips by creator", {
                  clipsCount: clips.length,
                  processedCreators: processedCreatorCount,
                  hasMore,
                });
              },
            );
          },
        );
      },
  };
};

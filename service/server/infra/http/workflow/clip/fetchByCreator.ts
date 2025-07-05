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

                // Enqueue the fetch clips by creator operation
                await cu.fetchClipsByCreatorEnqueue({
                  batchSize: params.batchSize,
                  memberType: params.memberType,
                });

                span.setAttribute("enqueued", true);
                span.setAttribute("batch_size", params.batchSize || "default");
                span.setAttribute("member_type", params.memberType || "all");

                AppLogger.debug("Enqueued fetch clips by creator operation", {
                  batchSize: params.batchSize,
                  memberType: params.memberType,
                });
              },
            );
          },
        );
      },
  };
};

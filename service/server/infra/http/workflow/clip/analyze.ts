import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { AppLogger } from "@vspo-lab/logging";
import {
  type BindingAppWorkerEnv,
  zBindingAppWorkerEnv,
} from "../../../../config/env/worker";
import { withTracer } from "../../trace/cloudflare";

export interface AnalyzeClipsParams {
  batchSize?: number;
}

export const analyzeClipsWorkflow = () => {
  return {
    handler:
      () =>
      async (
        env: BindingAppWorkerEnv,
        event: WorkflowEvent<AnalyzeClipsParams>,
        step: WorkflowStep,
      ) => {
        const e = zBindingAppWorkerEnv.safeParse(env);
        if (!e.success) {
          console.error(e.error.message);
          return;
        }

        const params = event.payload || {};
        const batchSize = params.batchSize || 100;

        await step.do(
          "analyze clips",
          {
            retries: { limit: 3, delay: "30 second", backoff: "exponential" },
            timeout: "30 minutes",
          },
          async () => {
            return withTracer(
              "clip-workflow",
              "analyze-clips",
              async (span) => {
                const cau = await env.APP_WORKER.newClipAnalysisUsecase();

                // Analyze clips
                const result = await cau.analyzeClips(batchSize);

                if (result.err) {
                  AppLogger.error("Failed to analyze clips", {
                    error: result.err,
                    batchSize,
                  });
                  throw result.err;
                }

                const { analyzed, unanalyzed, newlyAnalyzed, skipped, failed } =
                  result.val;

                span.setAttribute("analyzed_count", analyzed);
                span.setAttribute("unanalyzed_count", unanalyzed);
                span.setAttribute("newly_analyzed", newlyAnalyzed || 0);
                span.setAttribute("skipped_count", skipped || 0);
                span.setAttribute("failed_count", failed || 0);

                AppLogger.info("Analyzed clips", {
                  analyzed,
                  unanalyzed,
                  newlyAnalyzed: newlyAnalyzed || 0,
                  skipped: skipped || 0,
                  failed: failed || 0,
                });

                // If there are more clips to process, we can trigger another workflow
                if (unanalyzed > 0) {
                  AppLogger.info("More clips to analyze", {
                    remainingCount: unanalyzed,
                  });
                }
              },
            );
          },
        );
      },
  };
};

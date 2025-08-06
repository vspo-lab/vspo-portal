import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import {
  type BindingAppWorkerEnv,
  zBindingAppWorkerEnv,
} from "../../../../config/env/worker";
import { withTracer } from "../../trace/cloudflare";

export const searchClipsWorkflow = () => {
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
        await step.do(
          "fetch and send clips",
          {
            retries: { limit: 1, delay: "5 second", backoff: "linear" },
            timeout: "5 minutes",
          },
          async () => {
            return withTracer(
              "stream-workflow",
              "search-live-streams",
              async (span) => {
                const result =
                  await env.CLIP_QUERY_SERVICE.searchNewVspoClipsAndNewCreators();
                if (result.err) {
                  throw result.err;
                }
                if (result.val.newCreators.length !== 0) {
                  span.setAttribute(
                    "creators_count",
                    result.val.newCreators.length,
                  );
                  const _ =
                    await env.CREATOR_COMMAND_SERVICE.batchUpsertEnqueue(
                      result.val.newCreators,
                    );
                }
                if (result.val.clips.length !== 0) {
                  span.setAttribute("videos_count", result.val.clips.length);
                  const _ = await env.CLIP_COMMAND_SERVICE.batchUpsertEnqueue(
                    result.val.clips,
                  );
                }
              },
            );
          },
        );
      },
  };
};

export const searchClipsByVspoMemberNameWorkflow = () => {
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
        await step.do(
          "fetch and send clips",
          {
            retries: { limit: 1, delay: "5 second", backoff: "linear" },
            timeout: "5 minutes",
          },
          async () => {
            return withTracer(
              "stream-workflow",
              "search-live-streams",
              async (span) => {
                const result =
                  await env.CLIP_QUERY_SERVICE.searchNewClipsByVspoMemberName();
                if (result.err) {
                  throw result.err;
                }
                if (result.val.newCreators.length !== 0) {
                  const _ =
                    await env.CREATOR_COMMAND_SERVICE.batchUpsertEnqueue(
                      result.val.newCreators,
                    );
                }
                if (result.val.clips.length !== 0) {
                  span.setAttribute("videos_count", result.val.clips.length);
                  const _ = await env.CLIP_COMMAND_SERVICE.batchUpsertEnqueue(
                    result.val.clips,
                  );
                }
              },
            );
          },
        );
      },
  };
};

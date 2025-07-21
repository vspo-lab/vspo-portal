import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { AppLogger } from "@vspo-lab/logging";
import {
  type BindingAppWorkerEnv,
  zBindingAppWorkerEnv,
} from "../../../../config/env/worker";
import { withTracer } from "../../trace/cloudflare";

export const existClipsWorkflow = () => {
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

        const lv = await step.do(
          "fetch clips with pagination",
          {
            retries: { limit: 3, delay: "5 second", backoff: "linear" },
            timeout: "3 minutes",
          },
          async () => {
            return withTracer(
              "clip-workflow",
              "list-clips-paginated",
              async (span) => {
                const cu = await env.APP_WORKER.newClipUsecase();
                const allClips = [];
                let currentPage = 0;
                let hasNext = true;
                const pageSize = 500;
                const maxClips = 5000;

                while (hasNext && allClips.length < maxClips) {
                  const r1 = await cu.list({
                    limit: pageSize,
                    page: currentPage,
                    languageCode: "default",
                    orderBy: "desc",
                    includeDeleted: true,
                    clipType: "clip",
                    platform: "youtube",
                  });

                  if (r1.err) {
                    throw r1.err;
                  }

                  allClips.push(...r1.val.clips);
                  currentPage++;
                  hasNext = r1.val.pagination.hasNext;

                  // Break if we've reached our max clips limit
                  if (allClips.length >= maxClips) {
                    allClips.length = maxClips; // Trim to exactly maxClips
                    break;
                  }
                }

                span.setAttribute("clips_count", allClips.length);
                logger.info(
                  `Retrieved ${allClips.length} clips with pagination`,
                );
                return { clips: allClips };
              },
            );
          },
        );

        const sv = await step.do(
          "fetch clips with pagination",
          {
            retries: { limit: 3, delay: "5 second", backoff: "linear" },
            timeout: "3 minutes",
          },
          async () => {
            return withTracer(
              "clip-workflow",
              "list-clips-paginated",
              async (span) => {
                const cu = await env.APP_WORKER.newClipUsecase();
                const allClips = [];
                let currentPage = 0;
                let hasNext = true;
                const pageSize = 500;
                const maxClips = 5000;

                while (hasNext && allClips.length < maxClips) {
                  const r1 = await cu.list({
                    limit: pageSize,
                    page: currentPage,
                    languageCode: "default",
                    orderBy: "desc",
                    includeDeleted: true,
                    clipType: "short",
                  });

                  if (r1.err) {
                    throw r1.err;
                  }

                  allClips.push(...r1.val.clips);
                  currentPage++;
                  hasNext = r1.val.pagination.hasNext;

                  // Break if we've reached our max clips limit
                  if (allClips.length >= maxClips) {
                    allClips.length = maxClips; // Trim to exactly maxClips
                    break;
                  }
                }

                span.setAttribute("clips_count", allClips.length);
                logger.info(
                  `Retrieved ${allClips.length} clips with pagination`,
                );
                return { shorts: allClips };
              },
            );
          },
        );

        const combinedClips = [...lv.clips, ...sv.shorts];

        // Now we have all clips in lv.allClips for further processing
        if (combinedClips.length === 0) {
          logger.info("No clips found to process");
          return;
        }

        const r1 = await step.do(
          "process clips",
          {
            retries: { limit: 3, delay: "5 second", backoff: "linear" },
            timeout: "2 minutes",
          },
          async () => {
            return withTracer(
              "clip-workflow",
              "process-clips",
              async (span) => {
                const cu = await env.APP_WORKER.newClipUsecase();

                // Example: Get the clipIds from all clips
                const clipIds = combinedClips.map((clip) => clip.id);
                span.setAttribute("clips_to_process", clipIds.length);

                // Example of what you might do with the clips
                const result = await cu.searchExistVspoClips({ clipIds });
                if (result.err) {
                  throw result.err;
                }

                return { result: result.val };
              },
            );
          },
        );

        await step.do(
          "delete clips",
          {
            retries: { limit: 3, delay: "5 second", backoff: "linear" },
            timeout: "2 minutes",
          },
          async () => {
            return withTracer(
              "clip-workflow",
              "delete-clips",
              async (_span) => {
                const cu = await env.APP_WORKER.newClipUsecase();
                const deletedClips = combinedClips.filter(
                  (clip) => clip.deleted,
                );
                await cu.deleteClips({
                  clipIds: deletedClips.map((clip) => clip.id),
                });
              },
            );
          },
        );

        await Promise.allSettled([
          step.do(
            "batch upsert clips",
            {
              retries: { limit: 3, delay: "5 second", backoff: "linear" },
              timeout: "2 minutes",
            },
            async () => {
              return withTracer(
                "clip-workflow",
                "batch-upsert-clips",
                async (_span) => {
                  const cu = await env.APP_WORKER.newClipUsecase();

                  await cu.batchUpsertEnqueue(r1.result.clips);
                },
              );
            },
          ),
          step.do(
            "logical deletion",
            {
              retries: { limit: 3, delay: "5 second", backoff: "linear" },
              timeout: "2 minutes",
            },
            async () => {
              return withTracer(
                "clip-workflow",
                "batch-upsert-clips",
                async (_span) => {
                  const cu = await env.APP_WORKER.newClipUsecase();
                  const deletedClips = combinedClips
                    .filter((clip) =>
                      r1.result.notExistsClipIds.includes(clip.rawId),
                    )
                    .map((clip) => {
                      return {
                        ...clip,
                        deleted: true,
                      };
                    });
                  await cu.batchUpsertEnqueue(deletedClips);
                },
              );
            },
          ),
        ]);
      },
  };
};

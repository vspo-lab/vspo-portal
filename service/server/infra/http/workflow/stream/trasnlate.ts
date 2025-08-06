import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { AppLogger } from "@vspo-lab/logging";
import {
  type BindingAppWorkerEnv,
  zBindingAppWorkerEnv,
} from "../../../../config/env/worker";
import { TargetLangSchema } from "../../../../domain/translate";
import { withTracer } from "../../trace/cloudflare";

export const translateStreamsWorkflow = () => {
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
          "fetch default language videos",
          {
            retries: { limit: 3, delay: "5 second", backoff: "linear" },
            timeout: "1 minutes",
          },
          async () => {
            return withTracer(
              "stream-workflow",
              "fetch-default-language-streams",
              async (span) => {
                const liveStreams = await env.STREAM_QUERY_SERVICE.list({
                  limit: 100,
                  page: 0,
                  languageCode: "default",

                  status: "live",
                  orderBy: "desc",
                });

                if (liveStreams.err) {
                  throw liveStreams.err;
                }

                const upcomingStreams = await env.STREAM_QUERY_SERVICE.list({
                  limit: 100,
                  page: 0,
                  languageCode: "default",

                  status: "upcoming",
                  orderBy: "desc",
                });

                if (upcomingStreams.err) {
                  throw upcomingStreams.err;
                }

                const videos = liveStreams.val.streams.concat(
                  upcomingStreams.val.streams,
                );
                span.setAttribute(
                  "live_videos_count",
                  liveStreams.val.streams.length,
                );
                span.setAttribute(
                  "upcoming_videos_count",
                  upcomingStreams.val.streams.length,
                );
                span.setAttribute("total_videos_count", videos.length);
                return { val: videos };
              },
            );
          },
        );

        if (lv.val?.length === 0) {
          logger.info("No videos to translate");
          return;
        }
        const target = TargetLangSchema.options.map(async (lang) => {
          const liveStreams = await env.STREAM_QUERY_SERVICE.list({
            limit: 100,
            page: 0,
            languageCode: lang,

            status: "live",
            orderBy: "desc",
          });

          if (liveStreams.err) {
            throw liveStreams.err;
          }

          const upcomingStreams = await env.STREAM_QUERY_SERVICE.list({
            limit: 100,
            page: 0,
            languageCode: lang,

            status: "upcoming",
            orderBy: "desc",
          });

          if (upcomingStreams.err) {
            throw upcomingStreams.err;
          }

          const videos = liveStreams.val.streams.concat(
            upcomingStreams.val.streams,
          );

          const notTranslatedStreams = lv.val.filter(
            (v) => !videos.some((v2) => v2.rawId === v.rawId),
          );

          return step.do(
            `fetch and ${lang} translate videos`,
            {
              retries: { limit: 3, delay: "5 second", backoff: "linear" },
              timeout: "1 minutes",
            },
            async () => {
              return withTracer(
                "stream-workflow",
                `translate-streams-to-${lang}`,
                async (span) => {
                  span.setAttribute("language", lang);
                  span.setAttribute(
                    "videos_count",
                    notTranslatedStreams.length,
                  );
                  await env.STREAM_COMMAND_SERVICE.translateStreamEnqueue({
                    languageCode: lang,
                    streams: notTranslatedStreams,
                  });
                },
              );
            },
          );
        });
        const results = await Promise.allSettled(target);

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

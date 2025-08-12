import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { AppLogger } from "@vspo-lab/logging";
import {
  type BindingAppWorkerEnv,
  zBindingAppWorkerEnv,
} from "../../../../config/env/worker";
import { TargetLangSchema } from "../../../../domain/translate";
import { withTracer } from "../../../http/trace/cloudflare";

export const translateCreatorsWorkflow = () => {
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
          "fetch default language creators",
          {
            retries: { limit: 3, delay: "5 second", backoff: "linear" },
            timeout: "1 minutes",
          },
          async () => {
            return withTracer(
              "creator-workflow",
              "fetch-default-language-creators",
              async (span) => {
                const queryService = env.CREATOR_QUERY_SERVICE;
                const result = await queryService.list({
                  limit: 30,
                  page: 0,
                  languageCode: "default",
                  memberType: "vspo_jp",
                });

                if (result.err) {
                  throw result.err;
                }

                const result2 = await queryService.list({
                  limit: 30,
                  page: 0,
                  languageCode: "default",
                  memberType: "vspo_en",
                });

                if (result2.err) {
                  throw result2.err;
                }

                const creators = result.val.creators.concat(
                  result2.val.creators,
                );
                span.setAttribute("creators_count", creators.length);
                return { val: creators };
              },
            );
          },
        );

        if (lv.val?.length === 0) {
          logger.info("No creators to translate");
          return;
        }

        const results = await Promise.allSettled(
          TargetLangSchema.options.map((lang) =>
            step.do(
              `fetch and ${lang} translate creators`,
              {
                retries: { limit: 3, delay: "5 second", backoff: "linear" },
                timeout: "1 minutes",
              },
              async () => {
                return withTracer(
                  "creator-workflow",
                  `translate-creators-to-${lang}`,
                  async (span) => {
                    const commandService = env.CREATOR_COMMAND_SERVICE;
                    span.setAttribute("language", lang);
                    span.setAttribute("creators_count", lv.val.length);
                    await commandService.translateCreatorEnqueue({
                      languageCode: lang,
                      creators: lv.val,
                    });
                  },
                );
              },
            ),
          ),
        );

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

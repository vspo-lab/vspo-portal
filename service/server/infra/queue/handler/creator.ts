import { AppLogger } from "@vspo-lab/logging";
import { batchEnqueueWithChunks } from "../../../cmd/server/internal/application";
import { type Creator, CreatorsSchema } from "../../../domain";
import type { ICreatorInteractor } from "../../../usecase";
import type { MessageParam } from ".";
import type { QueueHandler } from "./base";

type TranslateCreator = Creator & {
  kind: "translate-creator";
  languageCode: string;
};
type UpsertCreator = Creator & { kind: "upsert-creator" };

export type CreatorMessage = TranslateCreator | UpsertCreator;

// Type guard functions
export function isTranslateCreator(
  message: unknown,
): message is TranslateCreator {
  return (
    typeof message === "object" &&
    message !== null &&
    "kind" in message &&
    message.kind === "translate-creator"
  );
}

export function isUpsertCreator(message: unknown): message is UpsertCreator {
  return (
    typeof message === "object" &&
    message !== null &&
    "kind" in message &&
    message.kind === "upsert-creator"
  );
}

export function createCreatorHandler(
  creatorInteractor: ICreatorInteractor,
  queue: Queue<MessageParam>,
): QueueHandler {
  async function processUpsertCreator(
    messages: UpsertCreator[],
  ): Promise<void> {
    AppLogger.debug(
      `Processing ${messages.length} messages of kind: upsert-creator`,
    );

    const creators = CreatorsSchema.safeParse(messages);
    if (!creators.success) {
      AppLogger.error(`Invalid creators: ${creators.error.message}`);
      return;
    }

    const r = await creatorInteractor.batchUpsert(creators.data);
    if (r.err) {
      AppLogger.error(`Failed to upsert creators: ${r.err.message}`);
      throw r.err;
    }
  }

  async function processTranslateCreator(
    messages: TranslateCreator[],
  ): Promise<void> {
    AppLogger.debug(
      `Processing ${messages.length} messages of kind: translate-creator`,
    );

    const cr = CreatorsSchema.safeParse(messages);
    if (!cr.success) {
      AppLogger.error(`Invalid creators: ${cr.error.message}`);
      return;
    }

    // Group creators by language code more efficiently
    const creatorsByLang = new Map<string, typeof cr.data>();

    for (const creator of cr.data) {
      const langCode = creator.languageCode;
      if (!langCode) {
        AppLogger.warn(
          `Creator missing language code, skipping: ${creator.id || "unknown"}`,
        );
        continue;
      }

      if (!creatorsByLang.has(langCode)) {
        creatorsByLang.set(langCode, []);
      }
      creatorsByLang.get(langCode)?.push(creator);
    }

    AppLogger.debug(`Grouped creators by ${creatorsByLang.size} languages`);

    // Process each language group separately
    for (const [langCode, creators] of creatorsByLang.entries()) {
      AppLogger.debug(
        `Processing ${creators.length} creators for language: ${langCode}`,
      );

      const tc = await creatorInteractor.translateCreator({
        languageCode: langCode,
        creators: creators,
      });

      if (tc.err) {
        AppLogger.error(
          `Failed to translate creators for ${langCode}: ${tc.err.message}`,
        );
        continue;
      }

      if (!tc.val?.length || tc.val.length === 0) {
        AppLogger.debug(`No creators to translate for ${langCode}`);
        continue;
      }

      await batchEnqueueWithChunks<Creator, MessageParam>(
        tc.val,
        50,
        (creator: Creator) => ({
          body: { ...creator, kind: "upsert-creator" } as MessageParam,
        }),
        queue,
      );
    }
  }

  return {
    async process(messages: unknown[]): Promise<void> {
      const translateCreators: TranslateCreator[] = [];
      const upsertCreators: UpsertCreator[] = [];

      for (const message of messages) {
        if (isTranslateCreator(message)) {
          translateCreators.push(message);
        } else if (isUpsertCreator(message)) {
          upsertCreators.push(message);
        }
      }

      if (upsertCreators.length > 0) {
        await processUpsertCreator(upsertCreators);
      }

      if (translateCreators.length > 0) {
        await processTranslateCreator(translateCreators);
      }
    },
  };
}

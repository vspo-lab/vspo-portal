import { AppLogger } from "@vspo-lab/logging";
import { type Clip, ClipsSchema } from "../../../domain/clip";
import type {
  FetchClipsByCreatorParams,
  IClipInteractor,
} from "../../../usecase/clip";
import type { QueueHandler } from "./base";

export type UpsertClip = Clip & { kind: "upsert-clip" };
export type FetchClipsByCreator = FetchClipsByCreatorParams & {
  kind: "fetch-clips-by-creator";
};

// Type guard functions
export function isUpsertClip(message: unknown): message is UpsertClip {
  return (
    typeof message === "object" &&
    message !== null &&
    "kind" in message &&
    message.kind === "upsert-clip"
  );
}

export function isFetchClipsByCreator(
  message: unknown,
): message is FetchClipsByCreator {
  return (
    typeof message === "object" &&
    message !== null &&
    "kind" in message &&
    message.kind === "fetch-clips-by-creator"
  );
}

export function createClipHandler(
  clipInteractor: IClipInteractor,
): QueueHandler {
  async function processUpsertClip(messages: UpsertClip[]): Promise<void> {
    AppLogger.debug(
      `Processing ${messages.length} messages of kind: upsert-clip`,
    );

    const clips = ClipsSchema.safeParse(messages);
    if (!clips.success) {
      AppLogger.error(`Invalid clips: ${clips.error.message}`);
      return;
    }

    const v = await clipInteractor.batchUpsert(clips.data);
    if (v.err) {
      AppLogger.error(`Failed to upsert clips: ${v.err.message}`);
      throw v.err;
    }
  }

  async function processFetchClipsByCreator(
    messages: FetchClipsByCreator[],
  ): Promise<void> {
    AppLogger.debug(
      `Processing ${messages.length} messages of kind: fetch-clips-by-creator`,
    );

    // Process each fetch request
    for (const message of messages) {
      const result = await clipInteractor.fetchClipsByCreator({
        batchSize: message.batchSize,
        maxQuotaUsage: message.maxQuotaUsage,
        memberType: message.memberType,
      });

      if (result.err) {
        AppLogger.error(
          `Failed to fetch clips by creator: ${result.err.message}`,
        );
        throw result.err;
      }

      const { clips, processedCreatorIds, hasMore } = result.val;

      AppLogger.debug("Fetched clips by creator via queue", {
        clipsCount: clips.length,
        processedCreators: processedCreatorIds.length,
        hasMore,
      });

      // Batch upsert clips if any were found
      if (clips.length > 0) {
        const upsertResult = await clipInteractor.batchUpsert(clips);
        if (upsertResult.err) {
          AppLogger.error("Failed to upsert clips in queue handler", {
            error: upsertResult.err,
            clipCount: clips.length,
          });
          throw upsertResult.err;
        }
        AppLogger.debug("Successfully upserted clips in queue handler", {
          clipCount: clips.length,
        });
      }

      // Update lastClipFetchedAt for processed creators
      if (processedCreatorIds.length > 0) {
        const updateResult =
          await clipInteractor.updateCreatorsLastClipFetchedAt(
            processedCreatorIds,
          );
        if (updateResult.err) {
          AppLogger.error(
            "Failed to update lastClipFetchedAt in queue handler",
            {
              error: updateResult.err,
              creatorCount: processedCreatorIds.length,
            },
          );
          // Don't throw here - clips were already inserted successfully
          // This is a non-critical error that shouldn't fail the entire job
        } else {
          AppLogger.debug(
            "Successfully updated lastClipFetchedAt in queue handler",
            {
              creatorCount: processedCreatorIds.length,
            },
          );
        }
      }
    }
  }

  return {
    async process(messages: unknown[]): Promise<void> {
      const upsertClips: UpsertClip[] = [];
      const fetchClipsByCreator: FetchClipsByCreator[] = [];

      for (const message of messages) {
        if (isUpsertClip(message)) {
          upsertClips.push(message);
        } else if (isFetchClipsByCreator(message)) {
          fetchClipsByCreator.push(message);
        }
      }

      if (upsertClips.length > 0) {
        await processUpsertClip(upsertClips);
      }

      if (fetchClipsByCreator.length > 0) {
        await processFetchClipsByCreator(fetchClipsByCreator);
      }
    },
  };
}

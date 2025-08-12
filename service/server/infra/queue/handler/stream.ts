import { AppLogger } from "@vspo-lab/logging";
import { batchEnqueueWithChunks } from "../../../cmd/server/internal/application";
import { type Stream, StreamsSchema } from "../../../domain/stream";
import type { IStreamInteractor } from "../../../usecase/stream";
import type { MessageParam } from ".";
import type { QueueHandler } from "./base";

type TranslateStream = Stream & {
  kind: "translate-stream";
  languageCode: string;
};
type UpsertStream = Stream & { kind: "upsert-stream" };

export type StreamMessage = TranslateStream | UpsertStream;

// Type guard functions
export function isTranslateStream(
  message: unknown,
): message is TranslateStream {
  return (
    typeof message === "object" &&
    message !== null &&
    "kind" in message &&
    message.kind === "translate-stream"
  );
}

export function isUpsertStream(message: unknown): message is UpsertStream {
  return (
    typeof message === "object" &&
    message !== null &&
    "kind" in message &&
    message.kind === "upsert-stream"
  );
}

export function createStreamHandler(
  streamInteractor: IStreamInteractor,
  queue: Queue<MessageParam>,
): QueueHandler {
  async function processUpsertStream(messages: UpsertStream[]): Promise<void> {
    AppLogger.debug(
      `Processing ${messages.length} messages of kind: upsert-stream`,
    );

    AppLogger.debug("Upserting Queued streams", {
      streams: messages.map((v) => ({
        rawId: v.rawId,
        title: v.title,
        status: v.status,
        languageCode: v.languageCode,
      })),
    });

    const streams = StreamsSchema.safeParse(messages);
    if (!streams.success) {
      AppLogger.error(`Invalid streams: ${streams.error.message}`);
      return;
    }

    const v = await streamInteractor.batchUpsert(streams.data);
    if (v.err) {
      AppLogger.error(`Failed to upsert streams: ${v.err.message}`);
      throw v.err;
    }
  }

  async function processTranslateStream(
    messages: TranslateStream[],
  ): Promise<void> {
    AppLogger.debug(
      `Processing ${messages.length} messages of kind: translate-stream`,
    );

    const v = StreamsSchema.safeParse(messages);
    if (!v.success) {
      AppLogger.error(`Invalid streams: ${v.error.message}`);
      return;
    }

    // Group streams by language code
    const streamsByLang = v.data.reduce(
      (acc, stream) => {
        const langCode = stream.languageCode;
        if (!acc[langCode]) {
          acc[langCode] = [];
        }
        acc[langCode].push(stream);
        return acc;
      },
      {} as Record<string, typeof v.data>,
    );

    // Process each language group separately
    for (const [langCode, streams] of Object.entries(streamsByLang)) {
      const tv = await streamInteractor.translateStream({
        languageCode: langCode,
        streams: streams,
      });

      if (tv.err) {
        AppLogger.error(
          `Failed to translate streams for ${langCode}: ${tv.err.message}`,
        );
        continue;
      }

      if (!tv.val?.length || tv.val.length === 0) {
        AppLogger.debug(`No streams to translate for ${langCode}`);
        continue;
      }

      await batchEnqueueWithChunks<Stream, MessageParam>(
        tv.val,
        50,
        (stream: Stream) => ({
          body: { ...stream, kind: "upsert-stream" } as MessageParam,
        }),
        queue,
      );
    }
  }

  return {
    async process(messages: unknown[]): Promise<void> {
      const translatesStreams: TranslateStream[] = [];
      const upsertStreams: UpsertStream[] = [];

      for (const message of messages) {
        if (isTranslateStream(message)) {
          translatesStreams.push(message);
        } else if (isUpsertStream(message)) {
          upsertStreams.push(message);
        }
      }

      if (upsertStreams.length > 0) {
        await processUpsertStream(upsertStreams);
      }

      if (translatesStreams.length > 0) {
        await processTranslateStream(translatesStreams);
      }
    },
  };
}

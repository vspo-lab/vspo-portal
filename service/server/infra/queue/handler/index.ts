import { AppLogger } from "@vspo-lab/logging";
import { type AppWorkerEnv, zAppWorkerEnv } from "../../../config/env/internal";
import { setFeatureFlagProvider } from "../../../config/featureFlag";
import { createContainer } from "../../dependency";
import { createHandler, withTracer } from "../../http/trace";
import { createClipHandler } from "./clip";
import { createCreatorHandler } from "./creator";
import { createDiscordHandler } from "./discord";
import { createStreamHandler } from "./stream";

// Define all message types
export type Kind =
  | "translate-stream"
  | "upsert-stream"
  | "upsert-creator"
  | "translate-creator"
  | "discord-send-message"
  | "upsert-discord-server"
  | "delete-message-in-channel"
  | "upsert-clip"
  | "fetch-clips-by-creator";

export type MessageParam = unknown & { kind: Kind };

export const queueHandler = createHandler({
  queue: async (
    batch: MessageBatch<MessageParam>,
    env: AppWorkerEnv,
    _executionContext: ExecutionContext,
  ) => {
    setFeatureFlagProvider(env);
    return await withTracer("QueueHandler", "queue.consumer", async (span) => {
      const e = zAppWorkerEnv.safeParse(env);
      if (!e.success) {
        console.log(e.error.message);
        return;
      }
      const c = createContainer(e.data);
      const logger = AppLogger.getInstance(e.data);

      // Group messages by their kind for logging
      const messagesByKind = new Map<Kind, number>();
      for (const message of batch.messages) {
        const body = message.body as MessageParam | undefined;
        if (!body || !body.kind) continue;

        const count = messagesByKind.get(body.kind) || 0;
        messagesByKind.set(body.kind, count + 1);
      }

      // Log message kinds and their counts
      const messageInfo = Array.from(messagesByKind.entries())
        .map(([kind, count]) => `${kind}: ${count}`)
        .join(", ");

      logger.info(`Processing message groups: ${messageInfo}`);

      // Set span attributes
      span.setAttributes({
        queue: batch.queue,
        messageTypes: Array.from(messagesByKind.keys()),
        messageCounts: Array.from(messagesByKind.values()),
      });

      /**
       * Processing order:
       * 1. Creators/Channels/Discord servers
       * 2. Streams/Clips
       * 3. Translations
       * 4. Others
       */

      // Extract all message bodies
      const messages = batch.messages
        .map((message) => message.body)
        .filter((body): body is MessageParam => !!body);

      // Initialize handlers
      const creatorHandler = createCreatorHandler(
        c.creatorInteractor,
        env.WRITE_QUEUE,
      );
      const discordHandler = createDiscordHandler(c.discordInteractor);
      const streamHandler = createStreamHandler(
        c.streamInteractor,
        env.WRITE_QUEUE,
      );
      const clipHandler = createClipHandler(c.clipInteractor);

      // Process messages with each handler in order
      await creatorHandler.process(messages);
      await discordHandler.process(messages);
      await streamHandler.process(messages);
      await clipHandler.process(messages);
    });
  },
});

import { AppLogger } from "@vspo-lab/logging";
import type { DiscordServer } from "../../../domain/discord";
import { t } from "../../../domain/service/i18n";
import type { Stream } from "../../../domain/stream";
import type { IDiscordInteractor } from "../../../usecase/discord";
import type { QueueHandler } from "./base";

type DiscordSend = Stream & { kind: "discord-send-message" };
type UpsertDiscordServer = DiscordServer & { kind: "upsert-discord-server" };
type DeleteMessageInChannel = {
  channelId: string;
  kind: "delete-message-in-channel";
};

export type DiscordMessage =
  | DiscordSend
  | UpsertDiscordServer
  | DeleteMessageInChannel;

// Type guard functions
export function isUpsertDiscordServer(
  message: unknown,
): message is UpsertDiscordServer {
  return (
    typeof message === "object" &&
    message !== null &&
    "kind" in message &&
    message.kind === "upsert-discord-server"
  );
}

export function isDeleteMessageInChannel(
  message: unknown,
): message is DeleteMessageInChannel {
  return (
    typeof message === "object" &&
    message !== null &&
    "kind" in message &&
    message.kind === "delete-message-in-channel"
  );
}

export function createDiscordHandler(
  discordInteractor: IDiscordInteractor,
): QueueHandler {
  async function processUpsertDiscordServer(
    messages: UpsertDiscordServer[],
  ): Promise<void> {
    AppLogger.debug(
      `Processing ${messages.length} messages of kind: upsert-discord-server`,
    );

    AppLogger.debug(`Upserting Discord servers: ${messages.length}`);
    AppLogger.debug("Discord servers", {
      servers: messages,
    });

    const sv = await discordInteractor.batchUpsert(messages);
    if (sv.err) {
      AppLogger.error(`Failed to upsert discord servers: ${sv.err.message}`);
      throw sv.err;
    }

    // initial add channel
    const initialAddChannel = messages.flatMap((server) =>
      server.discordChannels.filter((ch) => ch.isInitialAdd),
    );

    if (initialAddChannel.length > 0) {
      AppLogger.debug("Initial add channel", {
        channels: initialAddChannel,
      });

      await Promise.allSettled(
        initialAddChannel.map((ch) =>
          discordInteractor.sendAdminMessage({
            channelId: ch.rawId,
            content: t("initialAddChannel.success"),
          }),
        ),
      );
    }
  }

  async function processDeleteMessageInChannel(
    messages: DeleteMessageInChannel[],
  ): Promise<void> {
    AppLogger.debug(
      `Processing ${messages.length} messages of kind: delete-message-in-channel`,
    );

    if (!messages.length) {
      AppLogger.error("Invalid delete message in channel");
      return;
    }

    AppLogger.debug("Deleting messages in channels", {
      channelIds: messages,
    });

    await Promise.allSettled(
      messages.map((msg) =>
        discordInteractor.deleteAllMessagesInChannel(msg.channelId),
      ),
    );
  }

  return {
    async process(messages: unknown[]): Promise<void> {
      const upsertDiscordServers: UpsertDiscordServer[] = [];
      const deleteMessageInChannels: DeleteMessageInChannel[] = [];

      for (const message of messages) {
        if (isUpsertDiscordServer(message)) {
          upsertDiscordServers.push(message);
        } else if (isDeleteMessageInChannel(message)) {
          deleteMessageInChannels.push(message);
        }
      }

      if (upsertDiscordServers.length > 0) {
        await processUpsertDiscordServer(upsertDiscordServers);
      }

      if (deleteMessageInChannels.length > 0) {
        await processDeleteMessageInChannel(deleteMessageInChannels);
      }
    },
  };
}

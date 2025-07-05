import type { DiscordEmbed } from "@discordeno/types";
import { EmbedsBuilder } from "@discordeno/utils";
import { getCurrentUTCString } from "@vspo-lab/dayjs";
import { z } from "zod";
import { MemberTypeSchema } from "./creator";
import { t } from "./service/i18n";
import { StatusSchema, type Stream } from "./stream";

export const discordChannel = z
  .object({
    id: z.string(),
    rawId: z.string(),
    serverId: z.string(),
    name: z.string(),
    languageCode: z.string().optional().default("default"),
    memberType: MemberTypeSchema.optional(),
    selectedMemberIds: z.array(z.string()).optional(),
    // Flag to indicate if this is the initial addition of the channel
    isInitialAdd: z.boolean().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  })
  .transform((val) => {
    const now = getCurrentUTCString();
    return {
      ...val,
      createdAt: val.createdAt || now,
      updatedAt: val.updatedAt || now,
    };
  });

export const discordChannels = z.array(discordChannel);

export const discordServer = z
  .object({
    id: z.string(),
    rawId: z.string(),
    name: z.string(),
    languageCode: z.string().optional().default("default"),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .extend({
    discordChannels: z.lazy(() => discordChannels),
  })
  .transform((val) => {
    const now = getCurrentUTCString();
    return {
      ...val,
      createdAt: val.createdAt || now,
      updatedAt: val.updatedAt || now,
    };
  });
export const discordServers = z.array(discordServer);

export const discordMessage = z
  .object({
    id: z.string(),
    type: z.enum(["bot", "admin"]),
    rawId: z.string(),
    channelId: z.string(),
    content: z.string(),
    embedStreams: z.array(
      z.object({
        identifier: z.string(),
        title: z.string(),
        url: z.string(),
        thumbnail: z.string(),
        startedAt: z.string(),
        status: StatusSchema,
      }),
    ),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .transform((val) => {
    const now = getCurrentUTCString();
    return {
      ...val,
      createdAt: val.createdAt || now,
      updatedAt: val.updatedAt || now,
    };
  });

export const discordMessages = z.array(discordMessage);

export type DiscordChannel = z.infer<typeof discordChannel>;
export type DiscordChannels = z.infer<typeof discordChannels>;
export type DiscordServer = z.infer<typeof discordServer>;
export type DiscordServers = z.infer<typeof discordServers>;
export type DiscordMessage = z.infer<typeof discordMessage>;
export type DiscordMessages = z.infer<typeof discordMessages>;

export const createDiscordChannel = (
  discordChannel: DiscordChannel,
): DiscordChannel => {
  return discordChannel;
};

export const createDiscordChannels = (
  discordChannels: DiscordChannels,
): DiscordChannels => {
  return discordChannels;
};

export const createDiscordServer = (
  discordServer: DiscordServer,
): DiscordServer => {
  return discordServer;
};

export const createDiscordServers = (
  discordServers: DiscordServers,
): DiscordServers => {
  return discordServers;
};

export const createDiscordMessage = (
  discordMessage: DiscordMessage,
): DiscordMessage => {
  return discordMessage;
};

export const createDiscordMessages = (
  discordMessages: DiscordMessages,
): DiscordMessages => {
  return discordMessages;
};

export function createStreamEmbed(stream: Stream): DiscordEmbed {
  const embeds = new EmbedsBuilder()
    .newEmbed()
    .setTitle(stream.title, stream.link)
    .setColor(stream.statusColor)
    .addField(
      t("embedMessage.streamingDate", {
        languageCode: stream.languageCode,
      }),
      stream.formattedStartedAt || "",
      true,
    )
    .setImage(stream.thumbnailURL)
    .setAuthor(stream.creatorName || "Unknown", {
      icon_url: stream.creatorThumbnailURL || "",
    })
    .setFooter(
      t("embedMessage.poweredBySpodule", {
        translationOptions: {
          platform:
            stream.platform.charAt(0).toUpperCase() + stream.platform.slice(1),
        },
        languageCode: stream.languageCode,
      }),
      {
        icon_url: stream.platformIconURL,
      },
    );

  embeds.validate();

  return embeds[0];
}

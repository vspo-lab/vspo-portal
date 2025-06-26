import { z } from "zod";
import { ThumbnailURLSchema } from "./thumbnail";
import { type Platform, PlatformSchema } from "./video";

const ChannelDetailSchema = z
  .object({
    rawId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    thumbnailURL: ThumbnailURLSchema,
    publishedAt: z.string().datetime().nullable(),
    subscriberCount: z.number().int().nullable(),
  })
  .nullable();

const ChannelSchema = z.object({
  id: z.string(),
  creatorID: z.string(),
  youtube: ChannelDetailSchema,
  twitch: ChannelDetailSchema,
  twitCasting: ChannelDetailSchema,
  niconico: ChannelDetailSchema,
  bilibili: ChannelDetailSchema,
});

const ChannelsSchema = z.array(ChannelSchema);

type ChannelDetail = z.infer<typeof ChannelDetailSchema>;
type Channel = z.infer<typeof ChannelSchema>;
type Channels = z.infer<typeof ChannelsSchema>;

const createChannel = (channel: Channel): Channel => {
  return ChannelSchema.parse(channel);
};

const createChannels = (channels: Channels): Channels => {
  return ChannelsSchema.parse(channels);
};

export function getPlatformDetail(channel: Channel): {
  platform: Platform;
  detail: ChannelDetail;
} {
  const hasYouTube = channel.youtube !== null;
  const hasTwitch = channel.twitch !== null;
  const hasTwitCasting = channel.twitCasting !== null;
  const hasNiconico = channel.niconico !== null;
  const hasBilibili = channel.bilibili !== null;

  let platform: Platform;
  let detail: ChannelDetail;

  switch (true) {
    case hasYouTube: {
      platform = "youtube";
      detail = channel.youtube;
      break;
    }
    case hasTwitch: {
      platform = "twitch";
      detail = channel.twitch;
      break;
    }
    case hasTwitCasting: {
      platform = "twitcasting";
      detail = channel.twitCasting;
      break;
    }
    case hasNiconico: {
      platform = "niconico";
      detail = channel.niconico;
      break;
    }
    case hasBilibili: {
      platform = "bilibili";
      detail = channel.bilibili;
      break;
    }
    default: {
      platform = "unknown";
      detail = null;
      break;
    }
  }

  return { platform, detail };
}

export {
  ChannelSchema,
  ChannelsSchema,
  type Channel,
  type Channels,
  createChannel,
  createChannels,
};

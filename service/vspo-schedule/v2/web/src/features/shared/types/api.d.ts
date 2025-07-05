import { RpcTarget, WorkerEntrypoint } from "cloudflare:workers";
import type * as _vspo_lab_error from "@vspo-lab/error";
import type { AppError, Result } from "@vspo-lab/error";
import type { z } from "zod";

declare const FreechatsSchema: z.ZodArray<
  z.ZodEffects<
    z.ZodObject<
      {
        id: z.ZodString;
        rawId: z.ZodString;
        title: z.ZodString;
        languageCode: z.ZodEnum<
          ["en", "ja", "fr", "de", "es", "cn", "tw", "ko", "default"]
        >;
        rawChannelID: z.ZodString;
        description: z.ZodString;
        publishedAt: z.ZodString;
        platform: z.ZodEnum<
          ["youtube", "twitch", "twitcasting", "niconico", "unknown"]
        >;
        tags: z.ZodArray<z.ZodString, "many">;
        thumbnailURL: z.ZodString;
        creatorName: z.ZodOptional<z.ZodString>;
        creatorThumbnailURL: z.ZodOptional<z.ZodString>;
        viewCount: z.ZodNumber;
        link: z.ZodOptional<z.ZodString>;
        deleted: z.ZodDefault<z.ZodBoolean>;
        translated: z.ZodOptional<z.ZodBoolean>;
        videoPlayerLink: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        chatPlayerLink: z.ZodNullable<z.ZodOptional<z.ZodString>>;
      },
      "strip",
      z.ZodTypeAny,
      {
        id: string;
        rawId: string;
        title: string;
        languageCode:
          | "en"
          | "ja"
          | "fr"
          | "de"
          | "es"
          | "cn"
          | "tw"
          | "ko"
          | "default";
        rawChannelID: string;
        description: string;
        publishedAt: string;
        platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
        tags: string[];
        thumbnailURL: string;
        viewCount: number;
        deleted: boolean;
        creatorName?: string | undefined;
        creatorThumbnailURL?: string | undefined;
        link?: string | undefined;
        translated?: boolean | undefined;
        videoPlayerLink?: string | null | undefined;
        chatPlayerLink?: string | null | undefined;
      },
      {
        id: string;
        rawId: string;
        title: string;
        languageCode:
          | "en"
          | "ja"
          | "fr"
          | "de"
          | "es"
          | "cn"
          | "tw"
          | "ko"
          | "default";
        rawChannelID: string;
        description: string;
        publishedAt: string;
        platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
        tags: string[];
        thumbnailURL: string;
        viewCount: number;
        creatorName?: string | undefined;
        creatorThumbnailURL?: string | undefined;
        link?: string | undefined;
        deleted?: boolean | undefined;
        translated?: boolean | undefined;
        videoPlayerLink?: string | null | undefined;
        chatPlayerLink?: string | null | undefined;
      }
    >,
    {
      platformIconURL: string;
      link: string;
      thumbnailURL: string;
      videoPlayerLink: string | null;
      chatPlayerLink: string | null;
      id: string;
      rawId: string;
      title: string;
      languageCode:
        | "en"
        | "ja"
        | "fr"
        | "de"
        | "es"
        | "cn"
        | "tw"
        | "ko"
        | "default";
      rawChannelID: string;
      description: string;
      publishedAt: string;
      platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
      tags: string[];
      viewCount: number;
      deleted: boolean;
      creatorName?: string | undefined;
      creatorThumbnailURL?: string | undefined;
      translated?: boolean | undefined;
    },
    {
      id: string;
      rawId: string;
      title: string;
      languageCode:
        | "en"
        | "ja"
        | "fr"
        | "de"
        | "es"
        | "cn"
        | "tw"
        | "ko"
        | "default";
      rawChannelID: string;
      description: string;
      publishedAt: string;
      platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
      tags: string[];
      thumbnailURL: string;
      viewCount: number;
      creatorName?: string | undefined;
      creatorThumbnailURL?: string | undefined;
      link?: string | undefined;
      deleted?: boolean | undefined;
      translated?: boolean | undefined;
      videoPlayerLink?: string | null | undefined;
      chatPlayerLink?: string | null | undefined;
    }
  >,
  "many"
>;
type Freechats = z.output<typeof FreechatsSchema>;

declare const PageSchema: z.ZodObject<
  {
    currentPage: z.ZodNumber;
    prevPage: z.ZodNumber;
    nextPage: z.ZodNumber;
    totalPage: z.ZodNumber;
    totalCount: z.ZodNumber;
    hasNext: z.ZodBoolean;
  },
  "strip",
  z.ZodTypeAny,
  {
    totalCount: number;
    currentPage: number;
    prevPage: number;
    nextPage: number;
    totalPage: number;
    hasNext: boolean;
  },
  {
    totalCount: number;
    currentPage: number;
    prevPage: number;
    nextPage: number;
    totalPage: number;
    hasNext: boolean;
  }
>;
type Page = z.infer<typeof PageSchema>;

declare const CreatorsSchema: z.ZodArray<
  z.ZodEffects<
    z.ZodObject<
      {
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        languageCode: z.ZodDefault<z.ZodString>;
        memberType: z.ZodEnum<
          ["vspo_jp", "vspo_en", "vspo_ch", "vspo_all", "general"]
        >;
        thumbnailURL: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        channel: z.ZodNullable<
          z.ZodObject<
            {
              id: z.ZodString;
              creatorID: z.ZodString;
              youtube: z.ZodNullable<
                z.ZodObject<
                  {
                    rawId: z.ZodString;
                    name: z.ZodString;
                    description: z.ZodNullable<z.ZodString>;
                    thumbnailURL: z.ZodString;
                    publishedAt: z.ZodNullable<z.ZodString>;
                    subscriberCount: z.ZodNullable<z.ZodNumber>;
                  },
                  "strip",
                  z.ZodTypeAny,
                  {
                    rawId: string;
                    description: string | null;
                    publishedAt: string | null;
                    thumbnailURL: string;
                    name: string;
                    subscriberCount: number | null;
                  },
                  {
                    rawId: string;
                    description: string | null;
                    publishedAt: string | null;
                    thumbnailURL: string;
                    name: string;
                    subscriberCount: number | null;
                  }
                >
              >;
              twitch: z.ZodNullable<
                z.ZodObject<
                  {
                    rawId: z.ZodString;
                    name: z.ZodString;
                    description: z.ZodNullable<z.ZodString>;
                    thumbnailURL: z.ZodString;
                    publishedAt: z.ZodNullable<z.ZodString>;
                    subscriberCount: z.ZodNullable<z.ZodNumber>;
                  },
                  "strip",
                  z.ZodTypeAny,
                  {
                    rawId: string;
                    description: string | null;
                    publishedAt: string | null;
                    thumbnailURL: string;
                    name: string;
                    subscriberCount: number | null;
                  },
                  {
                    rawId: string;
                    description: string | null;
                    publishedAt: string | null;
                    thumbnailURL: string;
                    name: string;
                    subscriberCount: number | null;
                  }
                >
              >;
              twitCasting: z.ZodNullable<
                z.ZodObject<
                  {
                    rawId: z.ZodString;
                    name: z.ZodString;
                    description: z.ZodNullable<z.ZodString>;
                    thumbnailURL: z.ZodString;
                    publishedAt: z.ZodNullable<z.ZodString>;
                    subscriberCount: z.ZodNullable<z.ZodNumber>;
                  },
                  "strip",
                  z.ZodTypeAny,
                  {
                    rawId: string;
                    description: string | null;
                    publishedAt: string | null;
                    thumbnailURL: string;
                    name: string;
                    subscriberCount: number | null;
                  },
                  {
                    rawId: string;
                    description: string | null;
                    publishedAt: string | null;
                    thumbnailURL: string;
                    name: string;
                    subscriberCount: number | null;
                  }
                >
              >;
              niconico: z.ZodNullable<
                z.ZodObject<
                  {
                    rawId: z.ZodString;
                    name: z.ZodString;
                    description: z.ZodNullable<z.ZodString>;
                    thumbnailURL: z.ZodString;
                    publishedAt: z.ZodNullable<z.ZodString>;
                    subscriberCount: z.ZodNullable<z.ZodNumber>;
                  },
                  "strip",
                  z.ZodTypeAny,
                  {
                    rawId: string;
                    description: string | null;
                    publishedAt: string | null;
                    thumbnailURL: string;
                    name: string;
                    subscriberCount: number | null;
                  },
                  {
                    rawId: string;
                    description: string | null;
                    publishedAt: string | null;
                    thumbnailURL: string;
                    name: string;
                    subscriberCount: number | null;
                  }
                >
              >;
            },
            "strip",
            z.ZodTypeAny,
            {
              youtube: {
                rawId: string;
                description: string | null;
                publishedAt: string | null;
                thumbnailURL: string;
                name: string;
                subscriberCount: number | null;
              } | null;
              twitch: {
                rawId: string;
                description: string | null;
                publishedAt: string | null;
                thumbnailURL: string;
                name: string;
                subscriberCount: number | null;
              } | null;
              niconico: {
                rawId: string;
                description: string | null;
                publishedAt: string | null;
                thumbnailURL: string;
                name: string;
                subscriberCount: number | null;
              } | null;
              id: string;
              creatorID: string;
              twitCasting: {
                rawId: string;
                description: string | null;
                publishedAt: string | null;
                thumbnailURL: string;
                name: string;
                subscriberCount: number | null;
              } | null;
            },
            {
              youtube: {
                rawId: string;
                description: string | null;
                publishedAt: string | null;
                thumbnailURL: string;
                name: string;
                subscriberCount: number | null;
              } | null;
              twitch: {
                rawId: string;
                description: string | null;
                publishedAt: string | null;
                thumbnailURL: string;
                name: string;
                subscriberCount: number | null;
              } | null;
              niconico: {
                rawId: string;
                description: string | null;
                publishedAt: string | null;
                thumbnailURL: string;
                name: string;
                subscriberCount: number | null;
              } | null;
              id: string;
              creatorID: string;
              twitCasting: {
                rawId: string;
                description: string | null;
                publishedAt: string | null;
                thumbnailURL: string;
                name: string;
                subscriberCount: number | null;
              } | null;
            }
          >
        >;
        translated: z.ZodOptional<z.ZodBoolean>;
      },
      "strip",
      z.ZodTypeAny,
      {
        id: string;
        languageCode: string;
        thumbnailURL: string;
        memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general";
        channel: {
          youtube: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
          twitch: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
          niconico: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
          id: string;
          creatorID: string;
          twitCasting: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
        } | null;
        translated?: boolean | undefined;
        name?: string | undefined;
      },
      {
        id: string;
        memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general";
        channel: {
          youtube: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
          twitch: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
          niconico: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
          id: string;
          creatorID: string;
          twitCasting: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
        } | null;
        languageCode?: string | undefined;
        thumbnailURL?: string | undefined;
        translated?: boolean | undefined;
        name?: string | undefined;
      }
    >,
    {
      id: string;
      languageCode: string;
      thumbnailURL: string;
      memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general";
      channel: {
        youtube: {
          rawId: string;
          description: string | null;
          publishedAt: string | null;
          thumbnailURL: string;
          name: string;
          subscriberCount: number | null;
        } | null;
        twitch: {
          rawId: string;
          description: string | null;
          publishedAt: string | null;
          thumbnailURL: string;
          name: string;
          subscriberCount: number | null;
        } | null;
        niconico: {
          rawId: string;
          description: string | null;
          publishedAt: string | null;
          thumbnailURL: string;
          name: string;
          subscriberCount: number | null;
        } | null;
        id: string;
        creatorID: string;
        twitCasting: {
          rawId: string;
          description: string | null;
          publishedAt: string | null;
          thumbnailURL: string;
          name: string;
          subscriberCount: number | null;
        } | null;
      } | null;
      translated?: boolean | undefined;
      name?: string | undefined;
    },
    {
      id: string;
      memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general";
      channel: {
        youtube: {
          rawId: string;
          description: string | null;
          publishedAt: string | null;
          thumbnailURL: string;
          name: string;
          subscriberCount: number | null;
        } | null;
        twitch: {
          rawId: string;
          description: string | null;
          publishedAt: string | null;
          thumbnailURL: string;
          name: string;
          subscriberCount: number | null;
        } | null;
        niconico: {
          rawId: string;
          description: string | null;
          publishedAt: string | null;
          thumbnailURL: string;
          name: string;
          subscriberCount: number | null;
        } | null;
        id: string;
        creatorID: string;
        twitCasting: {
          rawId: string;
          description: string | null;
          publishedAt: string | null;
          thumbnailURL: string;
          name: string;
          subscriberCount: number | null;
        } | null;
      } | null;
      languageCode?: string | undefined;
      thumbnailURL?: string | undefined;
      translated?: boolean | undefined;
      name?: string | undefined;
    }
  >,
  "many"
>;
type Creators = z.infer<typeof CreatorsSchema>;

declare const StreamsSchema: z.ZodArray<
  z.ZodEffects<
    z.ZodObject<
      {
        id: z.ZodString;
        rawId: z.ZodString;
        title: z.ZodString;
        languageCode: z.ZodEnum<
          ["en", "ja", "fr", "de", "es", "cn", "tw", "ko", "default"]
        >;
        rawChannelID: z.ZodString;
        description: z.ZodString;
        publishedAt: z.ZodString;
        platform: z.ZodEnum<
          ["youtube", "twitch", "twitcasting", "niconico", "unknown"]
        >;
        tags: z.ZodArray<z.ZodString, "many">;
        thumbnailURL: z.ZodString;
        creatorName: z.ZodOptional<z.ZodString>;
        creatorThumbnailURL: z.ZodOptional<z.ZodString>;
        viewCount: z.ZodNumber;
        link: z.ZodOptional<z.ZodString>;
        deleted: z.ZodDefault<z.ZodBoolean>;
        translated: z.ZodOptional<z.ZodBoolean>;
        videoPlayerLink: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        chatPlayerLink: z.ZodNullable<z.ZodOptional<z.ZodString>>;
      } & {
        status: z.ZodEnum<["live", "upcoming", "ended", "unknown"]>;
        startedAt: z.ZodNullable<z.ZodString>;
        endedAt: z.ZodNullable<z.ZodString>;
      },
      "strip",
      z.ZodTypeAny,
      {
        status: "unknown" | "live" | "upcoming" | "ended";
        id: string;
        rawId: string;
        title: string;
        languageCode:
          | "en"
          | "ja"
          | "fr"
          | "de"
          | "es"
          | "cn"
          | "tw"
          | "ko"
          | "default";
        rawChannelID: string;
        description: string;
        publishedAt: string;
        platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
        tags: string[];
        thumbnailURL: string;
        viewCount: number;
        deleted: boolean;
        startedAt: string | null;
        endedAt: string | null;
        creatorName?: string | undefined;
        creatorThumbnailURL?: string | undefined;
        link?: string | undefined;
        translated?: boolean | undefined;
        videoPlayerLink?: string | null | undefined;
        chatPlayerLink?: string | null | undefined;
      },
      {
        status: "unknown" | "live" | "upcoming" | "ended";
        id: string;
        rawId: string;
        title: string;
        languageCode:
          | "en"
          | "ja"
          | "fr"
          | "de"
          | "es"
          | "cn"
          | "tw"
          | "ko"
          | "default";
        rawChannelID: string;
        description: string;
        publishedAt: string;
        platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
        tags: string[];
        thumbnailURL: string;
        viewCount: number;
        startedAt: string | null;
        endedAt: string | null;
        creatorName?: string | undefined;
        creatorThumbnailURL?: string | undefined;
        link?: string | undefined;
        deleted?: boolean | undefined;
        translated?: boolean | undefined;
        videoPlayerLink?: string | null | undefined;
        chatPlayerLink?: string | null | undefined;
      }
    >,
    {
      platformIconURL: string;
      link: string;
      statusColor: number;
      formattedStartedAt: string | null;
      formattedEndedAt: string | null;
      thumbnailURL: string;
      chatPlayerLink: string | null;
      videoPlayerLink: string | null;
      status: "unknown" | "live" | "upcoming" | "ended";
      id: string;
      rawId: string;
      title: string;
      languageCode:
        | "en"
        | "ja"
        | "fr"
        | "de"
        | "es"
        | "cn"
        | "tw"
        | "ko"
        | "default";
      rawChannelID: string;
      description: string;
      publishedAt: string;
      platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
      tags: string[];
      viewCount: number;
      deleted: boolean;
      startedAt: string | null;
      endedAt: string | null;
      creatorName?: string | undefined;
      creatorThumbnailURL?: string | undefined;
      translated?: boolean | undefined;
    },
    {
      status: "unknown" | "live" | "upcoming" | "ended";
      id: string;
      rawId: string;
      title: string;
      languageCode:
        | "en"
        | "ja"
        | "fr"
        | "de"
        | "es"
        | "cn"
        | "tw"
        | "ko"
        | "default";
      rawChannelID: string;
      description: string;
      publishedAt: string;
      platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
      tags: string[];
      thumbnailURL: string;
      viewCount: number;
      startedAt: string | null;
      endedAt: string | null;
      creatorName?: string | undefined;
      creatorThumbnailURL?: string | undefined;
      link?: string | undefined;
      deleted?: boolean | undefined;
      translated?: boolean | undefined;
      videoPlayerLink?: string | null | undefined;
      chatPlayerLink?: string | null | undefined;
    }
  >,
  "many"
>;
type Streams = z.output<typeof StreamsSchema>;

declare const ClipsSchema: z.ZodArray<
  z.ZodEffects<
    z.ZodObject<
      {
        id: z.ZodString;
        rawId: z.ZodString;
        title: z.ZodString;
        languageCode: z.ZodEnum<
          ["en", "ja", "fr", "de", "es", "cn", "tw", "ko", "default"]
        >;
        rawChannelID: z.ZodString;
        description: z.ZodString;
        publishedAt: z.ZodString;
        platform: z.ZodEnum<
          ["youtube", "twitch", "twitcasting", "niconico", "unknown"]
        >;
        tags: z.ZodArray<z.ZodString, "many">;
        thumbnailURL: z.ZodString;
        creatorName: z.ZodOptional<z.ZodString>;
        creatorThumbnailURL: z.ZodOptional<z.ZodString>;
        viewCount: z.ZodNumber;
        link: z.ZodOptional<z.ZodString>;
        deleted: z.ZodDefault<z.ZodBoolean>;
        translated: z.ZodOptional<z.ZodBoolean>;
        videoPlayerLink: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        chatPlayerLink: z.ZodNullable<z.ZodOptional<z.ZodString>>;
      } & {
        type: z.ZodEnum<["short", "clip"]>;
      },
      "strip",
      z.ZodTypeAny,
      {
        type: "short" | "clip";
        id: string;
        rawId: string;
        title: string;
        languageCode:
          | "en"
          | "ja"
          | "fr"
          | "de"
          | "es"
          | "cn"
          | "tw"
          | "ko"
          | "default";
        rawChannelID: string;
        description: string;
        publishedAt: string;
        platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
        tags: string[];
        thumbnailURL: string;
        viewCount: number;
        deleted: boolean;
        creatorName?: string | undefined;
        creatorThumbnailURL?: string | undefined;
        link?: string | undefined;
        translated?: boolean | undefined;
        videoPlayerLink?: string | null | undefined;
        chatPlayerLink?: string | null | undefined;
      },
      {
        type: "short" | "clip";
        id: string;
        rawId: string;
        title: string;
        languageCode:
          | "en"
          | "ja"
          | "fr"
          | "de"
          | "es"
          | "cn"
          | "tw"
          | "ko"
          | "default";
        rawChannelID: string;
        description: string;
        publishedAt: string;
        platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
        tags: string[];
        thumbnailURL: string;
        viewCount: number;
        creatorName?: string | undefined;
        creatorThumbnailURL?: string | undefined;
        link?: string | undefined;
        deleted?: boolean | undefined;
        translated?: boolean | undefined;
        videoPlayerLink?: string | null | undefined;
        chatPlayerLink?: string | null | undefined;
      }
    >,
    {
      platformIconURL: string;
      link: string;
      thumbnailURL: string;
      videoPlayerLink: string | null;
      type: "short" | "clip";
      id: string;
      rawId: string;
      title: string;
      languageCode:
        | "en"
        | "ja"
        | "fr"
        | "de"
        | "es"
        | "cn"
        | "tw"
        | "ko"
        | "default";
      rawChannelID: string;
      description: string;
      publishedAt: string;
      platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
      tags: string[];
      viewCount: number;
      deleted: boolean;
      creatorName?: string | undefined;
      creatorThumbnailURL?: string | undefined;
      translated?: boolean | undefined;
      chatPlayerLink?: string | null | undefined;
    },
    {
      type: "short" | "clip";
      id: string;
      rawId: string;
      title: string;
      languageCode:
        | "en"
        | "ja"
        | "fr"
        | "de"
        | "es"
        | "cn"
        | "tw"
        | "ko"
        | "default";
      rawChannelID: string;
      description: string;
      publishedAt: string;
      platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
      tags: string[];
      thumbnailURL: string;
      viewCount: number;
      creatorName?: string | undefined;
      creatorThumbnailURL?: string | undefined;
      link?: string | undefined;
      deleted?: boolean | undefined;
      translated?: boolean | undefined;
      videoPlayerLink?: string | null | undefined;
      chatPlayerLink?: string | null | undefined;
    }
  >,
  "many"
>;
type Clips = z.output<typeof ClipsSchema>;

declare const EventVisibilitySchema: z.ZodEnum<
  ["public", "private", "internal"]
>;
type EventVisibility = z.infer<typeof EventVisibilitySchema>;
declare const VspoEventSchema: z.ZodEffects<
  z.ZodObject<
    {
      id: z.ZodDefault<z.ZodString>;
      title: z.ZodString;
      storageFileId: z.ZodString;
      startedDate: z.ZodString;
      visibility: z.ZodDefault<z.ZodEnum<["public", "private", "internal"]>>;
      tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
      createdAt: z.ZodDefault<z.ZodString>;
      updatedAt: z.ZodDefault<z.ZodString>;
    },
    "strip",
    z.ZodTypeAny,
    {
      id: string;
      title: string;
      tags: string[];
      updatedAt: string;
      createdAt: string;
      storageFileId: string;
      startedDate: string;
      visibility: "private" | "public" | "internal";
    },
    {
      title: string;
      storageFileId: string;
      startedDate: string;
      id?: string | undefined;
      tags?: string[] | undefined;
      updatedAt?: string | undefined;
      createdAt?: string | undefined;
      visibility?: "private" | "public" | "internal" | undefined;
    }
  >,
  {
    publicUrl: string | undefined;
    id: string;
    title: string;
    tags: string[];
    updatedAt: string;
    createdAt: string;
    storageFileId: string;
    startedDate: string;
    visibility: "private" | "public" | "internal";
  },
  {
    title: string;
    storageFileId: string;
    startedDate: string;
    id?: string | undefined;
    tags?: string[] | undefined;
    updatedAt?: string | undefined;
    createdAt?: string | undefined;
    visibility?: "private" | "public" | "internal" | undefined;
  }
>;
declare const VspoEventsSchema: z.ZodArray<
  z.ZodEffects<
    z.ZodObject<
      {
        id: z.ZodDefault<z.ZodString>;
        title: z.ZodString;
        storageFileId: z.ZodString;
        startedDate: z.ZodString;
        visibility: z.ZodDefault<z.ZodEnum<["public", "private", "internal"]>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        createdAt: z.ZodDefault<z.ZodString>;
        updatedAt: z.ZodDefault<z.ZodString>;
      },
      "strip",
      z.ZodTypeAny,
      {
        id: string;
        title: string;
        tags: string[];
        updatedAt: string;
        createdAt: string;
        storageFileId: string;
        startedDate: string;
        visibility: "private" | "public" | "internal";
      },
      {
        title: string;
        storageFileId: string;
        startedDate: string;
        id?: string | undefined;
        tags?: string[] | undefined;
        updatedAt?: string | undefined;
        createdAt?: string | undefined;
        visibility?: "private" | "public" | "internal" | undefined;
      }
    >,
    {
      publicUrl: string | undefined;
      id: string;
      title: string;
      tags: string[];
      updatedAt: string;
      createdAt: string;
      storageFileId: string;
      startedDate: string;
      visibility: "private" | "public" | "internal";
    },
    {
      title: string;
      storageFileId: string;
      startedDate: string;
      id?: string | undefined;
      tags?: string[] | undefined;
      updatedAt?: string | undefined;
      createdAt?: string | undefined;
      visibility?: "private" | "public" | "internal" | undefined;
    }
  >,
  "many"
>;
type VspoEvent = z.output<typeof VspoEventSchema>;
type VspoEvents = z.output<typeof VspoEventsSchema>;

declare const discordServer: z.ZodEffects<
  z.ZodObject<
    {
      id: z.ZodString;
      rawId: z.ZodString;
      name: z.ZodString;
      languageCode: z.ZodDefault<z.ZodOptional<z.ZodString>>;
      createdAt: z.ZodString;
      updatedAt: z.ZodString;
    } & {
      discordChannels: z.ZodLazy<
        z.ZodArray<
          z.ZodEffects<
            z.ZodObject<
              {
                id: z.ZodString;
                rawId: z.ZodString;
                serverId: z.ZodString;
                name: z.ZodString;
                languageCode: z.ZodDefault<z.ZodOptional<z.ZodString>>;
                memberType: z.ZodOptional<
                  z.ZodEnum<
                    ["vspo_jp", "vspo_en", "vspo_ch", "vspo_all", "general"]
                  >
                >;
                isInitialAdd: z.ZodOptional<z.ZodBoolean>;
                createdAt: z.ZodOptional<z.ZodString>;
                updatedAt: z.ZodOptional<z.ZodString>;
              },
              "strip",
              z.ZodTypeAny,
              {
                id: string;
                rawId: string;
                languageCode: string;
                name: string;
                serverId: string;
                memberType?:
                  | "vspo_jp"
                  | "vspo_en"
                  | "vspo_ch"
                  | "vspo_all"
                  | "general"
                  | undefined;
                updatedAt?: string | undefined;
                createdAt?: string | undefined;
                isInitialAdd?: boolean | undefined;
              },
              {
                id: string;
                rawId: string;
                name: string;
                serverId: string;
                languageCode?: string | undefined;
                memberType?:
                  | "vspo_jp"
                  | "vspo_en"
                  | "vspo_ch"
                  | "vspo_all"
                  | "general"
                  | undefined;
                updatedAt?: string | undefined;
                createdAt?: string | undefined;
                isInitialAdd?: boolean | undefined;
              }
            >,
            {
              createdAt: string;
              updatedAt: string;
              id: string;
              rawId: string;
              languageCode: string;
              name: string;
              serverId: string;
              memberType?:
                | "vspo_jp"
                | "vspo_en"
                | "vspo_ch"
                | "vspo_all"
                | "general"
                | undefined;
              isInitialAdd?: boolean | undefined;
            },
            {
              id: string;
              rawId: string;
              name: string;
              serverId: string;
              languageCode?: string | undefined;
              memberType?:
                | "vspo_jp"
                | "vspo_en"
                | "vspo_ch"
                | "vspo_all"
                | "general"
                | undefined;
              updatedAt?: string | undefined;
              createdAt?: string | undefined;
              isInitialAdd?: boolean | undefined;
            }
          >,
          "many"
        >
      >;
    },
    "strip",
    z.ZodTypeAny,
    {
      id: string;
      rawId: string;
      languageCode: string;
      name: string;
      updatedAt: string;
      createdAt: string;
      discordChannels: {
        createdAt: string;
        updatedAt: string;
        id: string;
        rawId: string;
        languageCode: string;
        name: string;
        serverId: string;
        memberType?:
          | "vspo_jp"
          | "vspo_en"
          | "vspo_ch"
          | "vspo_all"
          | "general"
          | undefined;
        isInitialAdd?: boolean | undefined;
      }[];
    },
    {
      id: string;
      rawId: string;
      name: string;
      updatedAt: string;
      createdAt: string;
      discordChannels: {
        id: string;
        rawId: string;
        name: string;
        serverId: string;
        languageCode?: string | undefined;
        memberType?:
          | "vspo_jp"
          | "vspo_en"
          | "vspo_ch"
          | "vspo_all"
          | "general"
          | undefined;
        updatedAt?: string | undefined;
        createdAt?: string | undefined;
        isInitialAdd?: boolean | undefined;
      }[];
      languageCode?: string | undefined;
    }
  >,
  {
    createdAt: string;
    updatedAt: string;
    id: string;
    rawId: string;
    languageCode: string;
    name: string;
    discordChannels: {
      createdAt: string;
      updatedAt: string;
      id: string;
      rawId: string;
      languageCode: string;
      name: string;
      serverId: string;
      memberType?:
        | "vspo_jp"
        | "vspo_en"
        | "vspo_ch"
        | "vspo_all"
        | "general"
        | undefined;
      isInitialAdd?: boolean | undefined;
    }[];
  },
  {
    id: string;
    rawId: string;
    name: string;
    updatedAt: string;
    createdAt: string;
    discordChannels: {
      id: string;
      rawId: string;
      name: string;
      serverId: string;
      languageCode?: string | undefined;
      memberType?:
        | "vspo_jp"
        | "vspo_en"
        | "vspo_ch"
        | "vspo_all"
        | "general"
        | undefined;
      updatedAt?: string | undefined;
      createdAt?: string | undefined;
      isInitialAdd?: boolean | undefined;
    }[];
    languageCode?: string | undefined;
  }
>;
declare const discordServers: z.ZodArray<
  z.ZodEffects<
    z.ZodObject<
      {
        id: z.ZodString;
        rawId: z.ZodString;
        name: z.ZodString;
        languageCode: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
      } & {
        discordChannels: z.ZodLazy<
          z.ZodArray<
            z.ZodEffects<
              z.ZodObject<
                {
                  id: z.ZodString;
                  rawId: z.ZodString;
                  serverId: z.ZodString;
                  name: z.ZodString;
                  languageCode: z.ZodDefault<z.ZodOptional<z.ZodString>>;
                  memberType: z.ZodOptional<
                    z.ZodEnum<
                      ["vspo_jp", "vspo_en", "vspo_ch", "vspo_all", "general"]
                    >
                  >;
                  isInitialAdd: z.ZodOptional<z.ZodBoolean>;
                  createdAt: z.ZodOptional<z.ZodString>;
                  updatedAt: z.ZodOptional<z.ZodString>;
                },
                "strip",
                z.ZodTypeAny,
                {
                  id: string;
                  rawId: string;
                  languageCode: string;
                  name: string;
                  serverId: string;
                  memberType?:
                    | "vspo_jp"
                    | "vspo_en"
                    | "vspo_ch"
                    | "vspo_all"
                    | "general"
                    | undefined;
                  updatedAt?: string | undefined;
                  createdAt?: string | undefined;
                  isInitialAdd?: boolean | undefined;
                },
                {
                  id: string;
                  rawId: string;
                  name: string;
                  serverId: string;
                  languageCode?: string | undefined;
                  memberType?:
                    | "vspo_jp"
                    | "vspo_en"
                    | "vspo_ch"
                    | "vspo_all"
                    | "general"
                    | undefined;
                  updatedAt?: string | undefined;
                  createdAt?: string | undefined;
                  isInitialAdd?: boolean | undefined;
                }
              >,
              {
                createdAt: string;
                updatedAt: string;
                id: string;
                rawId: string;
                languageCode: string;
                name: string;
                serverId: string;
                memberType?:
                  | "vspo_jp"
                  | "vspo_en"
                  | "vspo_ch"
                  | "vspo_all"
                  | "general"
                  | undefined;
                isInitialAdd?: boolean | undefined;
              },
              {
                id: string;
                rawId: string;
                name: string;
                serverId: string;
                languageCode?: string | undefined;
                memberType?:
                  | "vspo_jp"
                  | "vspo_en"
                  | "vspo_ch"
                  | "vspo_all"
                  | "general"
                  | undefined;
                updatedAt?: string | undefined;
                createdAt?: string | undefined;
                isInitialAdd?: boolean | undefined;
              }
            >,
            "many"
          >
        >;
      },
      "strip",
      z.ZodTypeAny,
      {
        id: string;
        rawId: string;
        languageCode: string;
        name: string;
        updatedAt: string;
        createdAt: string;
        discordChannels: {
          createdAt: string;
          updatedAt: string;
          id: string;
          rawId: string;
          languageCode: string;
          name: string;
          serverId: string;
          memberType?:
            | "vspo_jp"
            | "vspo_en"
            | "vspo_ch"
            | "vspo_all"
            | "general"
            | undefined;
          isInitialAdd?: boolean | undefined;
        }[];
      },
      {
        id: string;
        rawId: string;
        name: string;
        updatedAt: string;
        createdAt: string;
        discordChannels: {
          id: string;
          rawId: string;
          name: string;
          serverId: string;
          languageCode?: string | undefined;
          memberType?:
            | "vspo_jp"
            | "vspo_en"
            | "vspo_ch"
            | "vspo_all"
            | "general"
            | undefined;
          updatedAt?: string | undefined;
          createdAt?: string | undefined;
          isInitialAdd?: boolean | undefined;
        }[];
        languageCode?: string | undefined;
      }
    >,
    {
      createdAt: string;
      updatedAt: string;
      id: string;
      rawId: string;
      languageCode: string;
      name: string;
      discordChannels: {
        createdAt: string;
        updatedAt: string;
        id: string;
        rawId: string;
        languageCode: string;
        name: string;
        serverId: string;
        memberType?:
          | "vspo_jp"
          | "vspo_en"
          | "vspo_ch"
          | "vspo_all"
          | "general"
          | undefined;
        isInitialAdd?: boolean | undefined;
      }[];
    },
    {
      id: string;
      rawId: string;
      name: string;
      updatedAt: string;
      createdAt: string;
      discordChannels: {
        id: string;
        rawId: string;
        name: string;
        serverId: string;
        languageCode?: string | undefined;
        memberType?:
          | "vspo_jp"
          | "vspo_en"
          | "vspo_ch"
          | "vspo_all"
          | "general"
          | undefined;
        updatedAt?: string | undefined;
        createdAt?: string | undefined;
        isInitialAdd?: boolean | undefined;
      }[];
      languageCode?: string | undefined;
    }
  >,
  "many"
>;
declare const discordMessage: z.ZodEffects<
  z.ZodObject<
    {
      id: z.ZodString;
      type: z.ZodEnum<["bot", "admin"]>;
      rawId: z.ZodString;
      channelId: z.ZodString;
      content: z.ZodString;
      embedStreams: z.ZodArray<
        z.ZodObject<
          {
            identifier: z.ZodString;
            title: z.ZodString;
            url: z.ZodString;
            thumbnail: z.ZodString;
            startedAt: z.ZodString;
            status: z.ZodEnum<["live", "upcoming", "ended", "unknown"]>;
          },
          "strip",
          z.ZodTypeAny,
          {
            status: "unknown" | "live" | "upcoming" | "ended";
            title: string;
            startedAt: string;
            url: string;
            identifier: string;
            thumbnail: string;
          },
          {
            status: "unknown" | "live" | "upcoming" | "ended";
            title: string;
            startedAt: string;
            url: string;
            identifier: string;
            thumbnail: string;
          }
        >,
        "many"
      >;
      createdAt: z.ZodString;
      updatedAt: z.ZodString;
    },
    "strip",
    z.ZodTypeAny,
    {
      type: "bot" | "admin";
      id: string;
      rawId: string;
      updatedAt: string;
      channelId: string;
      createdAt: string;
      content: string;
      embedStreams: {
        status: "unknown" | "live" | "upcoming" | "ended";
        title: string;
        startedAt: string;
        url: string;
        identifier: string;
        thumbnail: string;
      }[];
    },
    {
      type: "bot" | "admin";
      id: string;
      rawId: string;
      updatedAt: string;
      channelId: string;
      createdAt: string;
      content: string;
      embedStreams: {
        status: "unknown" | "live" | "upcoming" | "ended";
        title: string;
        startedAt: string;
        url: string;
        identifier: string;
        thumbnail: string;
      }[];
    }
  >,
  {
    createdAt: string;
    updatedAt: string;
    type: "bot" | "admin";
    id: string;
    rawId: string;
    channelId: string;
    content: string;
    embedStreams: {
      status: "unknown" | "live" | "upcoming" | "ended";
      title: string;
      startedAt: string;
      url: string;
      identifier: string;
      thumbnail: string;
    }[];
  },
  {
    type: "bot" | "admin";
    id: string;
    rawId: string;
    updatedAt: string;
    channelId: string;
    createdAt: string;
    content: string;
    embedStreams: {
      status: "unknown" | "live" | "upcoming" | "ended";
      title: string;
      startedAt: string;
      url: string;
      identifier: string;
      thumbnail: string;
    }[];
  }
>;
type DiscordServer = z.infer<typeof discordServer>;
type DiscordServers = z.infer<typeof discordServers>;
type DiscordMessage = z.infer<typeof discordMessage>;

declare const zAppWorkerEnv: z.ZodObject<
  {
    YOUTUBE_API_KEY: z.ZodString;
    TWITCH_CLIENT_ID: z.ZodString;
    TWITCH_CLIENT_SECRET: z.ZodString;
    TWITCASTING_ACCESS_TOKEN: z.ZodString;
    DEV_DB_CONNECTION_STRING: z.ZodDefault<z.ZodString>;
    DB: z.ZodType<Hyperdrive, z.ZodTypeDef, Hyperdrive>;
    WRITE_QUEUE: z.ZodType<Queue<unknown>, z.ZodTypeDef, Queue<unknown>>;
    APP_KV: z.ZodType<KVNamespace<string>, z.ZodTypeDef, KVNamespace<string>>;
    OPENAI_API_KEY: z.ZodString;
    OPENAI_ORGANIZATION: z.ZodString;
    OPENAI_PROJECT: z.ZodString;
    OPENAI_BASE_URL: z.ZodString;
  } & {
    DISCORD_APPLICATION_ID: z.ZodString;
    DISCORD_PUBLIC_KEY: z.ZodString;
    DISCORD_TOKEN: z.ZodString;
    ENVIRONMENT: z.ZodEnum<["production", "staging", "development", "local"]>;
    SERVICE_NAME: z.ZodString;
    LOG_TYPE: z.ZodDefault<z.ZodEnum<["pretty", "json"]>>;
    LOG_MINLEVEL: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    LOG_HIDE_POSITION: z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>;
    OTEL_EXPORTER_URL: z.ZodString;
    BASELIME_API_KEY: z.ZodString;
    SENTRY_DSN: z.ZodString;
  } & {
    DISCORD_TRANSLATION_SETTING: z.ZodEffects<
      z.ZodOptional<z.ZodString>,
      boolean,
      string | undefined
    >;
    DISCORD_BOT_MAINTENANCE: z.ZodEffects<
      z.ZodOptional<z.ZodString>,
      boolean,
      string | undefined
    >;
  },
  "strip",
  z.ZodTypeAny,
  {
    APP_KV: KVNamespace<string>;
    ENVIRONMENT: "production" | "staging" | "development" | "local";
    SERVICE_NAME: string;
    LOG_TYPE: "pretty" | "json";
    LOG_MINLEVEL: number;
    LOG_HIDE_POSITION: boolean;
    OTEL_EXPORTER_URL: string;
    BASELIME_API_KEY: string;
    SENTRY_DSN: string;
    DISCORD_TRANSLATION_SETTING: boolean;
    DISCORD_BOT_MAINTENANCE: boolean;
    OPENAI_API_KEY: string;
    OPENAI_ORGANIZATION: string;
    OPENAI_PROJECT: string;
    OPENAI_BASE_URL: string;
    DISCORD_APPLICATION_ID: string;
    DISCORD_PUBLIC_KEY: string;
    DISCORD_TOKEN: string;
    YOUTUBE_API_KEY: string;
    TWITCH_CLIENT_ID: string;
    TWITCH_CLIENT_SECRET: string;
    TWITCASTING_ACCESS_TOKEN: string;
    DEV_DB_CONNECTION_STRING: string;
    DB: Hyperdrive;
    WRITE_QUEUE: Queue<unknown>;
  },
  {
    APP_KV: KVNamespace<string>;
    ENVIRONMENT: "production" | "staging" | "development" | "local";
    SERVICE_NAME: string;
    OTEL_EXPORTER_URL: string;
    BASELIME_API_KEY: string;
    SENTRY_DSN: string;
    OPENAI_API_KEY: string;
    OPENAI_ORGANIZATION: string;
    OPENAI_PROJECT: string;
    OPENAI_BASE_URL: string;
    DISCORD_APPLICATION_ID: string;
    DISCORD_PUBLIC_KEY: string;
    DISCORD_TOKEN: string;
    YOUTUBE_API_KEY: string;
    TWITCH_CLIENT_ID: string;
    TWITCH_CLIENT_SECRET: string;
    TWITCASTING_ACCESS_TOKEN: string;
    DB: Hyperdrive;
    WRITE_QUEUE: Queue<unknown>;
    LOG_TYPE?: "pretty" | "json" | undefined;
    LOG_MINLEVEL?: string | undefined;
    LOG_HIDE_POSITION?: string | undefined;
    DISCORD_TRANSLATION_SETTING?: string | undefined;
    DISCORD_BOT_MAINTENANCE?: string | undefined;
    DEV_DB_CONNECTION_STRING?: string | undefined;
  }
>;
type AppWorkerEnv = z.infer<typeof zAppWorkerEnv>;

type BatchUpsertCreatorsParam = Creators;
type SearchByChannelIdsParam = {
  channel: {
    id: string;
    memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "general";
  }[];
};
type ListByMemberTypeParam = {
  limit: number;
  page: number;
  memberType?: "vspo_jp" | "vspo_en" | "vspo_ch" | "general";
  languageCode?: string;
};
type ListResponse$1 = {
  creators: Creators;
  pagination: Page;
};
type SearchByMemberTypeParam = {
  memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "general";
};
type TranslateCreatorParam = {
  languageCode: string;
  creators: Creators;
};
interface ICreatorInteractor {
  searchByChannelIds(
    params: SearchByChannelIdsParam,
  ): Promise<Result<Creators, AppError>>;
  searchByMemberType(
    params: SearchByMemberTypeParam,
  ): Promise<Result<Creators, AppError>>;
  batchUpsert(
    params: BatchUpsertCreatorsParam,
  ): Promise<Result<Creators, AppError>>;
  list(
    params: ListByMemberTypeParam,
  ): Promise<Result<ListResponse$1, AppError>>;
  translateCreator(
    params: TranslateCreatorParam,
  ): Promise<Result<Creators, AppError>>;
}

type BatchUpsertStreamsParam = Streams;
type ListParam = {
  limit: number;
  page: number;
  platform?: string;
  status?: string;
  memberType?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endedAt?: Date;
  languageCode: string;
  orderBy?: "asc" | "desc";
};
type ListResponse = {
  streams: Streams;
  pagination: Page;
};
type BatchDeleteByStreamIdsParam = {
  streamIds: string[];
};
type TranslateStreamParam = {
  languageCode: string;
  streams: Streams;
};
type SearchByStreamIdsAndCreateParam = {
  streamIds: string[];
};
interface IStreamInteractor {
  batchUpsert(
    params: BatchUpsertStreamsParam,
  ): Promise<Result<Streams, AppError>>;
  searchLive(): Promise<Result<Streams, AppError>>;
  searchExist(): Promise<Result<Streams, AppError>>;
  list(params: ListParam): Promise<Result<ListResponse, AppError>>;
  searchDeletedCheck(): Promise<Result<Streams, AppError>>;
  batchDeleteByStreamIds(
    params: BatchDeleteByStreamIdsParam,
  ): Promise<Result<void, AppError>>;
  translateStream(
    params: TranslateStreamParam,
  ): Promise<Result<Streams, AppError>>;
  getMemberStreams(): Promise<Result<Streams, AppError>>;
  deletedListIds(): Promise<Result<string[], AppError>>;
  searchByStreamsIdsAndCreate(
    params: SearchByStreamIdsAndCreateParam,
  ): Promise<Result<Streams, AppError>>;
}

type SendMessageParams = {
  channelIds: string[];
  channelLangaugeCode: string;
  channelMemberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general";
};
type AdjustBotChannelParams = {
  type: "add" | "remove";
  serverId: string;
  targetChannelId: string;
  serverLangaugeCode?: string;
  channelLangaugeCode?: string;
  memberType?: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general";
};
type ListDiscordServerParam = {
  limit: number;
  page: number;
};
type ListDiscordServerResponse = {
  discordServers: DiscordServers;
  pagination: Page;
};
type BatchUpsertDiscordServersParam = DiscordServers;
type SendAdminMessageParams = {
  channelId: string;
  content: string;
};
type DeletedChannelCheckParams = {
  serverId: string;
  channelId: string;
};
interface IDiscordInteractor {
  batchSendMessages(params: SendMessageParams): Promise<Result<void, AppError>>;
  adjustBotChannel(
    params: AdjustBotChannelParams,
  ): Promise<Result<DiscordServer, AppError>>;
  get(serverId: string): Promise<Result<DiscordServer, AppError>>;
  list(
    params: ListDiscordServerParam,
  ): Promise<Result<ListDiscordServerResponse, AppError>>;
  deleteAllMessagesInChannel(
    channelId: string,
  ): Promise<Result<void, AppError>>;
  batchUpsert(
    params: BatchUpsertDiscordServersParam,
  ): Promise<Result<DiscordServers, AppError>>;
  batchDeleteChannelsByRowChannelIds(
    channelIds: string[],
  ): Promise<Result<void, AppError>>;
  exists(serverId: string): Promise<Result<boolean, AppError>>;
  existsChannel(channelId: string): Promise<Result<boolean, AppError>>;
  sendAdminMessage(
    message: SendAdminMessageParams,
  ): Promise<Result<DiscordMessage, AppError>>;
  isDeletedChannel(
    params: DeletedChannelCheckParams,
  ): Promise<Result<boolean, AppError>>;
}

type UpsertEventParam = VspoEvent;
type BatchUpsertEventParam = VspoEvent[];
type ListEventsQuery = {
  limit: number;
  page: number;
  orderBy?: "asc" | "desc";
  visibility?: EventVisibility;
  startedDateFrom?: string;
  startedDateTo?: string;
};
type ListEventsResponse = {
  events: VspoEvents;
  pagination: Page;
};
interface IEventInteractor {
  list(query: ListEventsQuery): Promise<Result<ListEventsResponse, AppError>>;
  upsert(params: UpsertEventParam): Promise<Result<VspoEvent, AppError>>;
  get(id: string): Promise<Result<VspoEvent | null, AppError>>;
  delete(eventId: string): Promise<Result<void, AppError>>;
  batchUpsert(
    events: BatchUpsertEventParam,
  ): Promise<Result<VspoEvents, AppError>>;
  batchDelete(eventIds: string[]): Promise<Result<void, AppError>>;
}

type BatchUpsertClipsParam = Clips;
type ListClipsQuery = {
  limit: number;
  page: number;
  platform?: string;
  memberType?: string;
  languageCode: string;
  orderBy?: "asc" | "desc";
  channelIds?: string[];
  includeDeleted?: boolean;
  clipType?: "clip" | "short";
  orderKey?: "publishedAt" | "viewCount";
  afterPublishedAtDate?: Date;
  beforePublishedAtDate?: Date;
};
type ListClipsResponse = {
  clips: Clips;
  pagination: Page;
};
interface IClipInteractor {
  list(query: ListClipsQuery): Promise<Result<ListClipsResponse, AppError>>;
  batchUpsert(params: BatchUpsertClipsParam): Promise<Result<Clips, AppError>>;
  searchNewVspoClipsAndNewCreators(): Promise<
    Result<
      {
        newCreators: Creators;
        clips: Clips;
      },
      AppError
    >
  >;
  searchExistVspoClips({
    clipIds,
  }: {
    clipIds: string[];
  }): Promise<
    Result<
      {
        clips: Clips;
        notExistsClipIds: string[];
      },
      AppError
    >
  >;
  searchNewClipsByVspoMemberName(): Promise<
    Result<
      {
        newCreators: Creators;
        clips: Clips;
      },
      AppError
    >
  >;
  deleteClips({
    clipIds,
  }: {
    clipIds: string[];
  }): Promise<Result<void, AppError>>;
}

type ListFreechatsQuery = {
  limit: number;
  page: number;
  memberType?: string;
  languageCode: string;
  orderBy?: "asc" | "desc";
  orderKey?: "publishedAt" | "creatorName";
  channelIds?: string[];
  includeDeleted?: boolean;
};
type ListFreechatsResponse = {
  freechats: Freechats;
  pagination: Page;
};
interface IFreechatInteractor {
  list(
    query: ListFreechatsQuery,
  ): Promise<Result<ListFreechatsResponse, AppError>>;
}

type Kind =
  | "translate-stream"
  | "upsert-stream"
  | "upsert-creator"
  | "translate-creator"
  | "discord-send-message"
  | "upsert-discord-server"
  | "delete-message-in-channel"
  | "upsert-clip";
type MessageParam = unknown & {
  kind: Kind;
};

declare class StreamService extends RpcTarget {
  #private;
  constructor(usecase: IStreamInteractor, queue: Queue<MessageParam>);
  batchUpsertEnqueue(params: BatchUpsertStreamsParam): Promise<void>;
  batchUpsert(params: BatchUpsertStreamsParam): Promise<
    _vspo_lab_error.Result<
      {
        platformIconURL: string;
        link: string;
        statusColor: number;
        formattedStartedAt: string | null;
        formattedEndedAt: string | null;
        thumbnailURL: string;
        chatPlayerLink: string | null;
        videoPlayerLink: string | null;
        status: "unknown" | "live" | "upcoming" | "ended";
        id: string;
        rawId: string;
        title: string;
        languageCode:
          | "en"
          | "ja"
          | "fr"
          | "de"
          | "es"
          | "cn"
          | "tw"
          | "ko"
          | "default";
        rawChannelID: string;
        description: string;
        publishedAt: string;
        platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
        tags: string[];
        viewCount: number;
        deleted: boolean;
        startedAt: string | null;
        endedAt: string | null;
        creatorName?: string | undefined;
        creatorThumbnailURL?: string | undefined;
        translated?: boolean | undefined;
      }[],
      _vspo_lab_error.AppError
    >
  >;
  searchLive(): Promise<
    _vspo_lab_error.Result<
      {
        platformIconURL: string;
        link: string;
        statusColor: number;
        formattedStartedAt: string | null;
        formattedEndedAt: string | null;
        thumbnailURL: string;
        chatPlayerLink: string | null;
        videoPlayerLink: string | null;
        status: "unknown" | "live" | "upcoming" | "ended";
        id: string;
        rawId: string;
        title: string;
        languageCode:
          | "en"
          | "ja"
          | "fr"
          | "de"
          | "es"
          | "cn"
          | "tw"
          | "ko"
          | "default";
        rawChannelID: string;
        description: string;
        publishedAt: string;
        platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
        tags: string[];
        viewCount: number;
        deleted: boolean;
        startedAt: string | null;
        endedAt: string | null;
        creatorName?: string | undefined;
        creatorThumbnailURL?: string | undefined;
        translated?: boolean | undefined;
      }[],
      _vspo_lab_error.AppError
    >
  >;
  searchExist(): Promise<
    _vspo_lab_error.Result<
      {
        platformIconURL: string;
        link: string;
        statusColor: number;
        formattedStartedAt: string | null;
        formattedEndedAt: string | null;
        thumbnailURL: string;
        chatPlayerLink: string | null;
        videoPlayerLink: string | null;
        status: "unknown" | "live" | "upcoming" | "ended";
        id: string;
        rawId: string;
        title: string;
        languageCode:
          | "en"
          | "ja"
          | "fr"
          | "de"
          | "es"
          | "cn"
          | "tw"
          | "ko"
          | "default";
        rawChannelID: string;
        description: string;
        publishedAt: string;
        platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
        tags: string[];
        viewCount: number;
        deleted: boolean;
        startedAt: string | null;
        endedAt: string | null;
        creatorName?: string | undefined;
        creatorThumbnailURL?: string | undefined;
        translated?: boolean | undefined;
      }[],
      _vspo_lab_error.AppError
    >
  >;
  list(
    params: ListParam,
  ): Promise<_vspo_lab_error.Result<ListResponse, _vspo_lab_error.AppError>>;
  searchDeletedCheck(): Promise<
    _vspo_lab_error.Result<
      {
        platformIconURL: string;
        link: string;
        statusColor: number;
        formattedStartedAt: string | null;
        formattedEndedAt: string | null;
        thumbnailURL: string;
        chatPlayerLink: string | null;
        videoPlayerLink: string | null;
        status: "unknown" | "live" | "upcoming" | "ended";
        id: string;
        rawId: string;
        title: string;
        languageCode:
          | "en"
          | "ja"
          | "fr"
          | "de"
          | "es"
          | "cn"
          | "tw"
          | "ko"
          | "default";
        rawChannelID: string;
        description: string;
        publishedAt: string;
        platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
        tags: string[];
        viewCount: number;
        deleted: boolean;
        startedAt: string | null;
        endedAt: string | null;
        creatorName?: string | undefined;
        creatorThumbnailURL?: string | undefined;
        translated?: boolean | undefined;
      }[],
      _vspo_lab_error.AppError
    >
  >;
  batchDeleteByStreamIds(
    params: BatchDeleteByStreamIdsParam,
  ): Promise<_vspo_lab_error.Result<void, _vspo_lab_error.AppError>>;
  translateStreamEnqueue(params: TranslateStreamParam): Promise<void>;
  getMemberStreams(): Promise<
    _vspo_lab_error.Result<
      {
        platformIconURL: string;
        link: string;
        statusColor: number;
        formattedStartedAt: string | null;
        formattedEndedAt: string | null;
        thumbnailURL: string;
        chatPlayerLink: string | null;
        videoPlayerLink: string | null;
        status: "unknown" | "live" | "upcoming" | "ended";
        id: string;
        rawId: string;
        title: string;
        languageCode:
          | "en"
          | "ja"
          | "fr"
          | "de"
          | "es"
          | "cn"
          | "tw"
          | "ko"
          | "default";
        rawChannelID: string;
        description: string;
        publishedAt: string;
        platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
        tags: string[];
        viewCount: number;
        deleted: boolean;
        startedAt: string | null;
        endedAt: string | null;
        creatorName?: string | undefined;
        creatorThumbnailURL?: string | undefined;
        translated?: boolean | undefined;
      }[],
      _vspo_lab_error.AppError
    >
  >;
  deletedListIds(): Promise<
    _vspo_lab_error.Result<string[], _vspo_lab_error.AppError>
  >;
  searchByStreamsIdsAndCreate(params: SearchByStreamIdsAndCreateParam): Promise<
    _vspo_lab_error.Result<
      {
        platformIconURL: string;
        link: string;
        statusColor: number;
        formattedStartedAt: string | null;
        formattedEndedAt: string | null;
        thumbnailURL: string;
        chatPlayerLink: string | null;
        videoPlayerLink: string | null;
        status: "unknown" | "live" | "upcoming" | "ended";
        id: string;
        rawId: string;
        title: string;
        languageCode:
          | "en"
          | "ja"
          | "fr"
          | "de"
          | "es"
          | "cn"
          | "tw"
          | "ko"
          | "default";
        rawChannelID: string;
        description: string;
        publishedAt: string;
        platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
        tags: string[];
        viewCount: number;
        deleted: boolean;
        startedAt: string | null;
        endedAt: string | null;
        creatorName?: string | undefined;
        creatorThumbnailURL?: string | undefined;
        translated?: boolean | undefined;
      }[],
      _vspo_lab_error.AppError
    >
  >;
}
declare class ClipService extends RpcTarget {
  #private;
  constructor(usecase: IClipInteractor, queue: Queue<MessageParam>);
  batchUpsertEnqueue(params: BatchUpsertClipsParam): Promise<void>;
  batchUpsert(params: BatchUpsertClipsParam): Promise<
    _vspo_lab_error.Result<
      {
        platformIconURL: string;
        link: string;
        thumbnailURL: string;
        videoPlayerLink: string | null;
        type: "short" | "clip";
        id: string;
        rawId: string;
        title: string;
        languageCode:
          | "en"
          | "ja"
          | "fr"
          | "de"
          | "es"
          | "cn"
          | "tw"
          | "ko"
          | "default";
        rawChannelID: string;
        description: string;
        publishedAt: string;
        platform: "unknown" | "youtube" | "twitch" | "twitcasting" | "niconico";
        tags: string[];
        viewCount: number;
        deleted: boolean;
        creatorName?: string | undefined;
        creatorThumbnailURL?: string | undefined;
        translated?: boolean | undefined;
        chatPlayerLink?: string | null | undefined;
      }[],
      _vspo_lab_error.AppError
    >
  >;
  list(
    params: ListClipsQuery,
  ): Promise<
    _vspo_lab_error.Result<ListClipsResponse, _vspo_lab_error.AppError>
  >;
  searchNewVspoClipsAndNewCreators(): Promise<
    _vspo_lab_error.Result<
      {
        newCreators: Creators;
        clips: Clips;
      },
      _vspo_lab_error.AppError
    >
  >;
  searchExistVspoClips({
    clipIds,
  }: {
    clipIds: string[];
  }): Promise<
    _vspo_lab_error.Result<
      {
        clips: Clips;
        notExistsClipIds: string[];
      },
      _vspo_lab_error.AppError
    >
  >;
  searchNewClipsByVspoMemberName(): Promise<
    _vspo_lab_error.Result<
      {
        newCreators: Creators;
        clips: Clips;
      },
      _vspo_lab_error.AppError
    >
  >;
  deleteClips({
    clipIds,
  }: {
    clipIds: string[];
  }): Promise<_vspo_lab_error.Result<void, _vspo_lab_error.AppError>>;
}
declare class CreatorService extends RpcTarget {
  #private;
  constructor(usecase: ICreatorInteractor, queue: Queue<MessageParam>);
  batchUpsertEnqueue(params: BatchUpsertCreatorsParam): Promise<void>;
  translateCreatorEnqueue(params: TranslateCreatorParam): Promise<void>;
  searchByChannelIds(params: SearchByChannelIdsParam): Promise<
    _vspo_lab_error.Result<
      {
        id: string;
        languageCode: string;
        thumbnailURL: string;
        memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general";
        channel: {
          youtube: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
          twitch: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
          niconico: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
          id: string;
          creatorID: string;
          twitCasting: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
        } | null;
        translated?: boolean | undefined;
        name?: string | undefined;
      }[],
      _vspo_lab_error.AppError
    >
  >;
  searchByMemberType(params: SearchByMemberTypeParam): Promise<
    _vspo_lab_error.Result<
      {
        id: string;
        languageCode: string;
        thumbnailURL: string;
        memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general";
        channel: {
          youtube: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
          twitch: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
          niconico: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
          id: string;
          creatorID: string;
          twitCasting: {
            rawId: string;
            description: string | null;
            publishedAt: string | null;
            thumbnailURL: string;
            name: string;
            subscriberCount: number | null;
          } | null;
        } | null;
        translated?: boolean | undefined;
        name?: string | undefined;
      }[],
      _vspo_lab_error.AppError
    >
  >;
  list(params: ListByMemberTypeParam): Promise<
    _vspo_lab_error.Result<
      {
        creators: Creators;
        pagination: Page;
      },
      _vspo_lab_error.AppError
    >
  >;
}
declare class DiscordService extends RpcTarget {
  #private;
  constructor(usecase: IDiscordInteractor, queue: Queue<MessageParam>);
  sendStreamsToMultipleChannels(
    params: SendMessageParams,
  ): Promise<_vspo_lab_error.Result<void, _vspo_lab_error.AppError>>;
  adjustBotChannel(params: AdjustBotChannelParams): Promise<
    _vspo_lab_error.Result<
      {
        createdAt: string;
        updatedAt: string;
        id: string;
        rawId: string;
        languageCode: string;
        name: string;
        discordChannels: {
          createdAt: string;
          updatedAt: string;
          id: string;
          rawId: string;
          languageCode: string;
          name: string;
          serverId: string;
          memberType?:
            | "vspo_jp"
            | "vspo_en"
            | "vspo_ch"
            | "vspo_all"
            | "general"
            | undefined;
          isInitialAdd?: boolean | undefined;
        }[];
      },
      _vspo_lab_error.AppError
    >
  >;
  get(serverId: string): Promise<
    _vspo_lab_error.Result<
      {
        createdAt: string;
        updatedAt: string;
        id: string;
        rawId: string;
        languageCode: string;
        name: string;
        discordChannels: {
          createdAt: string;
          updatedAt: string;
          id: string;
          rawId: string;
          languageCode: string;
          name: string;
          serverId: string;
          memberType?:
            | "vspo_jp"
            | "vspo_en"
            | "vspo_ch"
            | "vspo_all"
            | "general"
            | undefined;
          isInitialAdd?: boolean | undefined;
        }[];
      },
      _vspo_lab_error.AppError
    >
  >;
  batchUpsertEnqueue(params: BatchUpsertDiscordServersParam): Promise<void>;
  batchDeleteChannelsByRowChannelIds(
    params: string[],
  ): Promise<_vspo_lab_error.Result<void, _vspo_lab_error.AppError>>;
  list(
    params: ListDiscordServerParam,
  ): Promise<
    _vspo_lab_error.Result<ListDiscordServerResponse, _vspo_lab_error.AppError>
  >;
  deleteAllMessagesInChannel(
    channelId: string,
  ): Promise<_vspo_lab_error.Result<void, _vspo_lab_error.AppError>>;
  exists(
    serverId: string,
  ): Promise<_vspo_lab_error.Result<boolean, _vspo_lab_error.AppError>>;
  existsChannel(
    channelId: string,
  ): Promise<_vspo_lab_error.Result<boolean, _vspo_lab_error.AppError>>;
  sendAdminMessage(message: SendAdminMessageParams): Promise<
    _vspo_lab_error.Result<
      {
        createdAt: string;
        updatedAt: string;
        type: "bot" | "admin";
        id: string;
        rawId: string;
        channelId: string;
        content: string;
        embedStreams: {
          status: "unknown" | "live" | "upcoming" | "ended";
          title: string;
          startedAt: string;
          url: string;
          identifier: string;
          thumbnail: string;
        }[];
      },
      _vspo_lab_error.AppError
    >
  >;
  deleteMessageInChannelEnqueue(channelId: string): Promise<void>;
}
declare class EventService extends RpcTarget {
  #private;
  constructor(usecase: IEventInteractor);
  list(
    params: ListEventsQuery,
  ): Promise<
    _vspo_lab_error.Result<ListEventsResponse, _vspo_lab_error.AppError>
  >;
  upsert(params: UpsertEventParam): Promise<
    _vspo_lab_error.Result<
      {
        publicUrl: string | undefined;
        id: string;
        title: string;
        tags: string[];
        updatedAt: string;
        createdAt: string;
        storageFileId: string;
        startedDate: string;
        visibility: "private" | "public" | "internal";
      },
      _vspo_lab_error.AppError
    >
  >;
  get(id: string): Promise<
    _vspo_lab_error.Result<
      {
        publicUrl: string | undefined;
        id: string;
        title: string;
        tags: string[];
        updatedAt: string;
        createdAt: string;
        storageFileId: string;
        startedDate: string;
        visibility: "private" | "public" | "internal";
      } | null,
      _vspo_lab_error.AppError
    >
  >;
  delete(
    id: string,
  ): Promise<_vspo_lab_error.Result<void, _vspo_lab_error.AppError>>;
  batchDelete(
    ids: string[],
  ): Promise<_vspo_lab_error.Result<void, _vspo_lab_error.AppError>>;
  batchUpsert(params: BatchUpsertEventParam): Promise<
    _vspo_lab_error.Result<
      {
        publicUrl: string | undefined;
        id: string;
        title: string;
        tags: string[];
        updatedAt: string;
        createdAt: string;
        storageFileId: string;
        startedDate: string;
        visibility: "private" | "public" | "internal";
      }[],
      _vspo_lab_error.AppError
    >
  >;
}
declare class FreechatService extends RpcTarget {
  #private;
  constructor(usecase: IFreechatInteractor);
  list(
    params: ListFreechatsQuery,
  ): Promise<
    _vspo_lab_error.Result<ListFreechatsResponse, _vspo_lab_error.AppError>
  >;
}
declare class ApplicationService extends WorkerEntrypoint<AppWorkerEnv> {
  newStreamUsecase(): StreamService;
  newCreatorUsecase(): CreatorService;
  newDiscordUsecase(): DiscordService;
  newClipUsecase(): ClipService;
  newEventUsecase(): EventService;
  newFreechatUsecase(): FreechatService;
  private setup;
}

export { ApplicationService };

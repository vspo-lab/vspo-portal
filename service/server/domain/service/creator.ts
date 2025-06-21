import { type AppError, Ok, type Result } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import { type Creator, type Creators, createCreator } from "..";
import type { ICreatorRepository, IYoutubeService } from "../../infra";
import type { IAIService } from "../../infra/ai";
import type { ICacheClient } from "../../infra/cache";
import { withTracerResult } from "../../infra/http/trace/cloudflare";
import { createUUID } from "../../pkg/uuid";

export interface ICreatorService {
  searchCreatorsByMemberType(params: {
    memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "general";
  }): Promise<Result<Creators, AppError>>;
  searchCreatorsByChannelIds(
    params: {
      channelId: string;
      memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "general";
    }[],
  ): Promise<Result<Creators, AppError>>;
  translateCreators({
    languageCode,
    creators,
  }: {
    languageCode: string;
    creators: Creators;
  }): Promise<Result<Creators, AppError>>;
}

// Helper function to check differences between creators
const diffCreators = (a: Creator, b: Creator): boolean => {
  if (a.name !== b.name) {
    return true;
  }
  if (a.memberType !== b.memberType) {
    return true;
  }
  if (a.thumbnailURL !== b.thumbnailURL) {
    return true;
  }
  if (a.channel?.youtube?.rawId !== b.channel?.youtube?.rawId) {
    return true;
  }
  if (a.channel?.youtube?.name !== b.channel?.youtube?.name) {
    return true;
  }
  return false;
};

export const createCreatorService = (deps: {
  youtubeClient: IYoutubeService;
  creatorRepository: ICreatorRepository;
  aiService: IAIService;
  cacheClient: ICacheClient;
}): ICreatorService => {
  const SERVICE_NAME = "CreatorService";

  const searchCreatorsByMemberType = async (params: {
    memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "general";
  }): Promise<Result<Creators, AppError>> => {
    return withTracerResult(
      SERVICE_NAME,
      "searchCreatorsByMemberType",
      async (span) => {
        span.setAttributes({
          memberType: params.memberType,
        });

        AppLogger.debug("Searching creators by member type", {
          service: SERVICE_NAME,
          memberType: params.memberType,
        });

        const c = await deps.creatorRepository.list({
          limit: 100,
          page: 0,
          memberType: params.memberType,
          languageCode: "default",
        });
        if (c.err) {
          AppLogger.error("Failed to list creators", {
            service: SERVICE_NAME,
            error: c.err,
          });
          return c;
        }

        const chs = await deps.youtubeClient.getChannels({
          channelIds: c.val
            .map((v) => v.channel?.youtube?.rawId)
            .filter((v) => v !== undefined),
        });

        if (chs.err) {
          AppLogger.error("Failed to get YouTube channels", {
            service: SERVICE_NAME,
            error: chs.err,
          });
          return chs;
        }

        const creators = c.val
          .map((v) => {
            const ch = chs.val.find(
              (ch) => ch.id === v.channel?.youtube?.rawId,
            );
            if (!v?.channel || !ch?.youtube) {
              return null;
            }
            const newCreator = createCreator({
              ...v,
              name: ch.youtube.name,
              thumbnailURL: ch.youtube.thumbnailURL,
              channel: {
                ...v.channel,
                youtube: ch.youtube,
              },
            });
            if (diffCreators(v, newCreator)) {
              return newCreator;
            }
            return null;
          })
          .filter((v) => v !== null);

        AppLogger.debug("Successfully found creators", {
          service: SERVICE_NAME,
          count: creators.length,
        });
        return Ok(creators);
      },
    );
  };

  const searchCreatorsByChannelIds = async (
    params: {
      channelId: string;
      memberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "general";
    }[],
  ): Promise<Result<Creators, AppError>> => {
    return withTracerResult(
      SERVICE_NAME,
      "searchCreatorsByChannelIds",
      async (span) => {
        AppLogger.debug("Searching creators by channel IDs", {
          service: SERVICE_NAME,
          channelCount: params.length,
        });

        const chs = await deps.youtubeClient.getChannels({
          channelIds: params.map((v) => v.channelId),
        });

        if (chs.err) {
          AppLogger.error("Failed to get YouTube channels", {
            service: SERVICE_NAME,
            error: chs.err,
          });
          return chs;
        }

        const creators = [];
        for (const ch of chs.val) {
          if (!ch.youtube) {
            continue;
          }
          const creatorId = createUUID();
          const channelId = createUUID();
          const creator = createCreator({
            id: creatorId,
            name: ch.youtube.name,
            languageCode: "default",
            memberType:
              params.find((v) => v.channelId === ch.id)?.memberType ||
              "general",
            thumbnailURL: ch.youtube.thumbnailURL,
            channel: {
              id: channelId,
              creatorID: creatorId,
              youtube: ch.youtube,
              twitCasting: null,
              twitch: null,
              niconico: null,
              bilibili: null,
            },
            translated: false,
          });
          creators.push(creator);
        }

        AppLogger.debug("Successfully created creators", {
          service: SERVICE_NAME,
          count: creators.length,
        });
        return Ok(creators);
      },
    );
  };

  const translateCreators = async ({
    languageCode,
    creators,
  }: {
    languageCode: string;
    creators: Creators;
  }): Promise<Result<Creators, AppError>> => {
    return withTracerResult(SERVICE_NAME, "translateCreators", async (span) => {
      AppLogger.debug("Translating creators", {
        service: SERVICE_NAME,
        languageCode,
        creatorCount: creators.length,
      });

      const translatePromises = creators.map((creator) =>
        deps.aiService.translateText(creator.name ?? "", languageCode),
      );
      const translatedResults = await Promise.allSettled(translatePromises);
      const translatedCreators = creators.map((creator, i) => {
        const translatedText =
          translatedResults[i].status === "fulfilled"
            ? (translatedResults[i].value.val?.translatedText ?? creator.name)
            : creator.name;
        return {
          ...creator,
          name: translatedText,
          languageCode: languageCode,
          translated: true,
        };
      });

      AppLogger.debug("Successfully translated creators", {
        service: SERVICE_NAME,
        count: translatedCreators.length,
      });
      return Ok(translatedCreators);
    });
  };

  return {
    searchCreatorsByMemberType,
    searchCreatorsByChannelIds,
    translateCreators,
  };
};

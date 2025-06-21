import { type AppError, Ok, type OkResult, type Result } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import {
  type Creator,
  type Creators,
  MemberTypeSchema,
  createCreator,
} from "..";
import { vspoKeywordMap } from "../../config/data/keyword";
import { type ITwitchService, type IYoutubeService, query } from "../../infra";
import { withTracerResult } from "../../infra/http/trace/cloudflare";
import type { ICreatorRepository } from "../../infra/repository/creator";
import { createUUID } from "../../pkg/uuid";
import { type Clips, isVspoClip } from "../clip";

export interface IClipService {
  searchNewVspoClipsAndNewCreators(): Promise<
    Result<{ newCreators: Creators; clips: Clips }, AppError>
  >;
  searchExistVspoClips({
    clipIds,
  }: { clipIds: string[] }): Promise<
    Result<{ clips: Clips; notExistsClipIds: string[] }, AppError>
  >;
  searchNewClipsByVspoMemberName(): Promise<
    Result<{ newCreators: Creators; clips: Clips }, AppError>
  >;
}

// Helper functions for the clip service
const masterCreators = async (deps: {
  creatorRepository: ICreatorRepository;
}): Promise<Result<{ jp: Creator[]; en: Creator[] }, AppError>> => {
  const jpCreators = await deps.creatorRepository.list({
    limit: 300,
    page: 0,
    memberType: MemberTypeSchema.Enum.vspo_jp,
    languageCode: "default",
  });
  if (jpCreators.err) {
    return jpCreators;
  }

  const enCreators = await deps.creatorRepository.list({
    limit: 300,
    page: 0,
    memberType: MemberTypeSchema.Enum.vspo_en,
    languageCode: "default",
  });
  if (enCreators.err) {
    return enCreators;
  }

  return Ok({ jp: jpCreators.val, en: enCreators.val });
};

export const createClipService = (deps: {
  youtubeClient: IYoutubeService;
  twitchClient: ITwitchService;
  creatorRepository: ICreatorRepository;
}): IClipService => {
  const SERVICE_NAME = "ClipService";

  const searchYoutubeVspoClips = async (): Promise<Result<Clips, AppError>> => {
    AppLogger.debug("Searching Vspo related YouTube clips", {
      service: SERVICE_NAME,
    });

    const promises = [
      deps.youtubeClient.searchClips({
        query: query.VSPO_JP_CLIP,
        order: "date",
      }),
      deps.youtubeClient.searchClips({
        query: query.VSPO_JP_CLIP,
        order: "relevance",
      }),
      deps.youtubeClient.searchClips({
        query: query.VSPO_EN_CLIP,
        order: "date",
      }),
      deps.youtubeClient.searchClips({
        query: query.VSPO_EN_CLIP,
        order: "relevance",
      }),
    ];

    const results = await Promise.allSettled(promises);
    const scs = results
      .filter(
        (r): r is PromiseFulfilledResult<OkResult<Clips>> =>
          r.status === "fulfilled" && !r.value.err,
      )
      .flatMap((r) => r.value.val);
    const failedResults = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );

    if (failedResults.length > 0) {
      AppLogger.warn("Some YouTube stream searches failed", {
        service: SERVICE_NAME,
        failedCount: failedResults.length,
        errors: failedResults.map((r) => r.reason),
      });
    }

    const clipIds = scs.map((c) => c.rawId);

    const clips = await deps.youtubeClient.getClips({
      videoIds: clipIds,
    });
    if (clips.err) {
      return clips;
    }

    // Filter clips that are related to Vspo
    // Ideally we would want to make a strict determination, but currently we're only checking if the license number exists
    const vspoClips = clips.val.filter((clip) => isVspoClip(clip));

    return Ok(vspoClips);
  };

  const searchTwitchVspoClips = async (): Promise<Result<Clips, AppError>> => {
    AppLogger.debug("Searching Vspo related Twitch clips", {
      service: SERVICE_NAME,
    });

    const cs = await masterCreators({
      creatorRepository: deps.creatorRepository,
    });
    if (cs.err) {
      return cs;
    }
    const twitchIds = cs.val.jp
      .map((c) => c.channel?.twitch?.rawId ?? "")
      .concat(cs.val.en.map((c) => c.channel?.twitch?.rawId ?? ""))
      .filter((id) => id !== "");

    const batchSize = 5;
    const allClips: Clips = [];

    for (let i = 0; i < twitchIds.length; i += batchSize) {
      const batch = twitchIds.slice(i, i + batchSize);
      const batchPromises = batch.map((id) =>
        deps.twitchClient.getClipsByUserID({
          userId: id,
        }),
      );

      const batchResults = await Promise.all(batchPromises);
      for (const result of batchResults) {
        if (result.err) {
          continue;
        }
        allClips.push(...result.val);
      }
    }

    return Ok(allClips);
  };

  const searchNewVspoClipsAndNewCreators = async (): Promise<
    Result<{ newCreators: Creators; clips: Clips }, AppError>
  > => {
    return withTracerResult(
      SERVICE_NAME,
      "searchNewVspoClipsAndNewCreators",
      async (span) => {
        // Get existing creators to exclude their channels
        const existingCreators = await masterCreators({
          creatorRepository: deps.creatorRepository,
        });
        if (existingCreators.err) {
          return existingCreators;
        }

        // Create a set of existing channel IDs to exclude
        const existingChannelIds = new Set<string>();
        for (const creator of [
          ...existingCreators.val.jp,
          ...existingCreators.val.en,
        ]) {
          if (creator.channel?.youtube?.rawId) {
            existingChannelIds.add(creator.channel.youtube.rawId);
          }
        }

        AppLogger.debug("Excluding clips from existing Vspo channels", {
          service: SERVICE_NAME,
          existingChannelCount: existingChannelIds.size,
        });

        const clipSearchPromises = [
          searchYoutubeVspoClips(),
          searchTwitchVspoClips(),
        ];

        const results = await Promise.allSettled(clipSearchPromises);

        const successResults = results
          .filter(
            (r): r is PromiseFulfilledResult<OkResult<Clips>> =>
              r.status === "fulfilled" && r.value.err === undefined,
          )
          .map((r) => r.value.val);

        const failedResults = results.filter(
          (
            r,
          ): r is
            | PromiseRejectedResult
            | PromiseFulfilledResult<Result<Clips, AppError>> =>
            r.status === "rejected" ||
            (r.status === "fulfilled" && r.value.err !== undefined),
        );

        if (failedResults.length > 0) {
          AppLogger.warn("Some clip searches failed", {
            service: SERVICE_NAME,
            failedCount: failedResults.length,
            errors: failedResults.map((r) =>
              r.status === "rejected" ? r.reason : r.value.err,
            ),
          });
        }

        if (successResults.length === 0) {
          return Ok({
            newCreators: [],
            clips: [],
          });
        }

        // Merge all clips from different platforms
        let vspoClips = successResults.flat();

        // Filter out clips from existing channels
        const initialClipsCount = vspoClips.length;
        vspoClips = vspoClips.filter(
          (clip) =>
            clip.platform !== "youtube" ||
            !existingChannelIds.has(clip.rawChannelID),
        );

        AppLogger.debug("Filtered out clips from existing channels", {
          service: SERVICE_NAME,
          initialClipsCount,
          filteredClipsCount: vspoClips.length,
          excludedClipsCount: initialClipsCount - vspoClips.length,
        });

        const uniqueChannelIds = new Set<string>();
        const notExistsChannelIds: string[] = [];
        for (const clip of vspoClips) {
          if (uniqueChannelIds.has(clip.rawChannelID)) {
            continue;
          }
          const cs = await deps.creatorRepository.existsByChannelId(
            clip.rawChannelID,
          );
          if (cs.err) {
            AppLogger.warn("Failed to check if channel exists", {
              service: SERVICE_NAME,
              error: cs.err,
            });
          }
          uniqueChannelIds.add(clip.rawChannelID);
          if (!cs.val && clip.platform === "youtube") {
            notExistsChannelIds.push(clip.rawChannelID);
          }
        }

        const ytChannels = await deps.youtubeClient.getChannels({
          channelIds: notExistsChannelIds,
        });
        if (ytChannels.err) {
          return ytChannels;
        }

        const newCreators: Creators = [];
        for (const ytChannel of ytChannels.val) {
          const creatorId = createUUID();
          newCreators.push(
            createCreator({
              id: creatorId,
              name: ytChannel.youtube?.name ?? "",
              languageCode: "default",
              memberType: "general",
              thumbnailURL: ytChannel.youtube?.thumbnailURL ?? "",
              channel: {
                id: createUUID(),
                youtube: {
                  rawId: ytChannel.id,
                  description: ytChannel.youtube?.description ?? "",
                  publishedAt: ytChannel.youtube?.publishedAt ?? "",
                  name: ytChannel.youtube?.name ?? "",
                  thumbnailURL: ytChannel.youtube?.thumbnailURL ?? "",
                  subscriberCount: ytChannel.youtube?.subscriberCount ?? 0,
                },
                twitch: null,
                twitCasting: null,
                niconico: null,
                bilibili: null,
                creatorID: creatorId,
              },
            }),
          );
        }

        return Ok({
          newCreators,
          clips: vspoClips,
        });
      },
    );
  };

  const searchExistVspoClips = async ({
    clipIds,
  }: { clipIds: string[] }): Promise<
    Result<{ clips: Clips; notExistsClipIds: string[] }, AppError>
  > => {
    return withTracerResult(
      SERVICE_NAME,
      "searchExistVspoClips",
      async (span) => {
        const clipsResult = await deps.youtubeClient.getClips({
          videoIds: clipIds,
        });
        if (clipsResult.err) {
          return clipsResult;
        }
        const clips = clipsResult.val;
        const notExistsClipIds = clipIds.filter(
          (id) => !clips.some((c) => c.rawId === id),
        );
        AppLogger.debug("Found clips", {
          service: SERVICE_NAME,
          clipsCount: clips.length,
          notExistsClipIdsCount: notExistsClipIds.length,
        });
        return Ok({
          clips,
          notExistsClipIds,
        });
      },
    );
  };

  const searchNewClipsByVspoMemberName = async (): Promise<
    Result<{ newCreators: Creators; clips: Clips }, AppError>
  > => {
    return withTracerResult(
      SERVICE_NAME,
      "searchNewClipsByVspoMemberName",
      async (span) => {
        const members = vspoKeywordMap.members.map((m) => m.nameJp);
        const orderTypes = ["date", "viewCount", "relevance"];
        const allClips: Clips = [];

        AppLogger.debug(
          "Searching Vspo related YouTube clips by member names with different order types",
          {
            service: SERVICE_NAME,
            memberCount: members.length,
            orderTypes,
          },
        );

        // Get existing creators to exclude their channels
        const existingCreators = await masterCreators({
          creatorRepository: deps.creatorRepository,
        });
        if (existingCreators.err) {
          return existingCreators;
        }

        // Create a set of existing channel IDs to exclude
        const existingChannelIds = new Set<string>();
        for (const creator of [
          ...existingCreators.val.jp,
          ...existingCreators.val.en,
        ]) {
          if (creator.channel?.youtube?.rawId) {
            existingChannelIds.add(creator.channel.youtube.rawId);
          }
        }

        AppLogger.debug("Excluding clips from existing Vspo channels", {
          service: SERVICE_NAME,
          existingChannelCount: existingChannelIds.size,
        });

        // Create search requests for each member with each order type
        const searchRequests: Array<{ query: string; order: string }> = [];
        for (const member of members) {
          for (const order of orderTypes) {
            searchRequests.push({ query: member, order });
          }
        }

        // Process search requests in batches
        const batchSize = 5;
        for (let i = 0; i < searchRequests.length; i += batchSize) {
          const batch = searchRequests.slice(i, i + batchSize);
          const batchPromises = batch.map((req) =>
            deps.youtubeClient.searchClips({
              query: req.query,
              order: req.order as "date" | "viewCount" | "relevance",
            }),
          );

          const results = await Promise.allSettled(batchPromises);

          const successResults = results
            .filter(
              (r): r is PromiseFulfilledResult<OkResult<Clips>> =>
                r.status === "fulfilled" && r.value.err === undefined,
            )
            .map((r) => r.value.val);

          const failedResults = results.filter(
            (r): r is PromiseRejectedResult => r.status === "rejected",
          );

          if (failedResults.length > 0) {
            AppLogger.warn("Some member clip searches failed", {
              service: SERVICE_NAME,
              failedCount: failedResults.length,
              errors: failedResults.map((r) => r.reason),
              batchStart: i,
              batchEnd: i + batch.length,
            });
          }

          // Flatten and add successful clips
          for (const clips of successResults) {
            allClips.push(...clips);
          }
        }

        // Filter clips that are related to Vspo and not from existing channels
        const vspoClips = allClips.filter(
          (clip) =>
            isVspoClip(clip) && !existingChannelIds.has(clip.rawChannelID),
        );

        // Remove duplicates by rawId
        const uniqueClips = Array.from(
          new Map(vspoClips.map((clip) => [clip.rawId, clip])).values(),
        );

        AppLogger.debug("Found new clips", {
          service: SERVICE_NAME,
          totalClipsFound: allClips.length,
          vspoClipsFound: vspoClips.length,
          uniqueClipsCount: uniqueClips.length,
        });

        // Get clip IDs for detailed information
        const clipIds = uniqueClips
          .filter((clip) => clip.platform === "youtube")
          .map((clip) => clip.rawId);

        // Get detailed clip information
        const detailedClips = await deps.youtubeClient.getClips({
          videoIds: clipIds,
        });

        if (detailedClips.err) {
          return detailedClips;
        }

        // Combine detailed YouTube clips with any non-YouTube clips
        const nonYoutubeClips = uniqueClips.filter(
          (clip) => clip.platform !== "youtube",
        );
        const finalClips = [...detailedClips.val, ...nonYoutubeClips];

        AppLogger.debug("Retrieved detailed clip information", {
          service: SERVICE_NAME,
          detailedClipsCount: detailedClips.val.length,
          nonYoutubeClipsCount: nonYoutubeClips.length,
          finalClipsCount: finalClips.length,
        });

        // Check for new creators
        const uniqueChannelIds = new Set<string>();
        const notExistsChannelIds: string[] = [];

        for (const clip of finalClips) {
          if (uniqueChannelIds.has(clip.rawChannelID)) {
            continue;
          }

          const cs = await deps.creatorRepository.existsByChannelId(
            clip.rawChannelID,
          );

          if (cs.err) {
            AppLogger.warn("Failed to check if channel exists", {
              service: SERVICE_NAME,
              error: cs.err,
            });
          }

          uniqueChannelIds.add(clip.rawChannelID);
          if (!cs.val && clip.platform === "youtube") {
            notExistsChannelIds.push(clip.rawChannelID);
          }
        }

        // Fetch details for new channels
        const ytChannels = await deps.youtubeClient.getChannels({
          channelIds: notExistsChannelIds,
        });

        if (ytChannels.err) {
          return ytChannels;
        }

        // Create new creator objects
        const newCreators: Creators = [];
        for (const ytChannel of ytChannels.val) {
          const creatorId = createUUID();
          newCreators.push(
            createCreator({
              id: creatorId,
              name: ytChannel.youtube?.name ?? "",
              languageCode: "default",
              memberType: "general",
              thumbnailURL: ytChannel.youtube?.thumbnailURL ?? "",
              channel: {
                id: createUUID(),
                youtube: {
                  rawId: ytChannel.id,
                  description: ytChannel.youtube?.description ?? "",
                  publishedAt: ytChannel.youtube?.publishedAt ?? "",
                  name: ytChannel.youtube?.name ?? "",
                  thumbnailURL: ytChannel.youtube?.thumbnailURL ?? "",
                  subscriberCount: ytChannel.youtube?.subscriberCount ?? 0,
                },
                twitch: null,
                twitCasting: null,
                niconico: null,
                bilibili: null,
                creatorID: creatorId,
              },
            }),
          );
        }

        return Ok({
          newCreators,
          clips: finalClips,
        });
      },
    );
  };

  return {
    searchNewVspoClipsAndNewCreators,
    searchExistVspoClips,
    searchNewClipsByVspoMemberName,
  };
};

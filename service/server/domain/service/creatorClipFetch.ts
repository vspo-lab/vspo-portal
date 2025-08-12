import { type AppError, Ok, type Result } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import { withTracerResult } from "../../infra/http/trace/cloudflare";
import type { IYoutubeService } from "../../infra/youtube";
import type { Clips } from "../clip";
import type { Creators } from "../creator";

export interface ICreatorClipFetchService {
  fetchClipsForCreators(params: {
    creators: Creators;
  }): Promise<
    Result<{ clips: Clips; processedCreatorIds: string[] }, AppError>
  >;
}

export const createCreatorClipFetchService = (deps: {
  youtubeClient: IYoutubeService;
}): ICreatorClipFetchService => {
  const SERVICE_NAME = "CreatorClipFetchService";

  const fetchClipsForCreators = async (params: {
    creators: Creators;
  }): Promise<
    Result<{ clips: Clips; processedCreatorIds: string[] }, AppError>
  > => {
    return await withTracerResult(
      SERVICE_NAME,
      "fetchClipsForCreators",
      async () => {
        const { creators } = params;
        const allClips: Clips = [];
        const processedCreatorIds: string[] = [];

        for (const creator of creators) {
          const youtubeChannelId = creator.channel?.youtube?.rawId;
          if (!youtubeChannelId) {
            AppLogger.debug("Creator has no YouTube channel", {
              service: SERVICE_NAME,
              creatorId: creator.id,
              creatorName: creator.name,
            });
            continue;
          }

          try {
            // Search for clips from this channel
            const searchResult = await deps.youtubeClient.searchClips({
              channelId: youtubeChannelId,
              order: "date",
              maxResults: 50, // Maximum allowed per request
            });

            if (searchResult.err) {
              AppLogger.error("Failed to search clips for creator", {
                service: SERVICE_NAME,
                creatorId: creator.id,
                channelId: youtubeChannelId,
                error: searchResult.err,
              });
              continue;
            }

            if (searchResult.val.length === 0) {
              processedCreatorIds.push(creator.id);
              continue;
            }

            // Batch fetch video details
            const videoIds = searchResult.val.map((clip) => clip.rawId);
            const batchSize = 50; // YouTube API allows up to 50 videos per request

            for (let i = 0; i < videoIds.length; i += batchSize) {
              const batch = videoIds.slice(i, i + batchSize);
              const videoDetails = await deps.youtubeClient.getClips({
                videoIds: batch,
              });

              if (videoDetails.err) {
                AppLogger.error("Failed to fetch video details", {
                  service: SERVICE_NAME,
                  creatorId: creator.id,
                  batchIndex: i / batchSize,
                  error: videoDetails.err,
                });
                continue;
              }

              allClips.push(...videoDetails.val);
            }

            processedCreatorIds.push(creator.id);

            AppLogger.debug("Fetched clips for creator", {
              service: SERVICE_NAME,
              creatorId: creator.id,
              creatorName: creator.name,
              clipCount: searchResult.val.length,
            });
          } catch (error) {
            AppLogger.error("Unexpected error fetching clips for creator", {
              service: SERVICE_NAME,
              creatorId: creator.id,
              error,
            });
          }
        }

        AppLogger.debug("Completed clip fetching", {
          service: SERVICE_NAME,
          totalClips: allClips.length,
          processedCreators: processedCreatorIds.length,
          totalCreators: creators.length,
        });

        return Ok({
          clips: allClips,
          processedCreatorIds,
        });
      },
    );
  };

  return {
    fetchClipsForCreators,
  };
};

import { WorkerEntrypoint } from "cloudflare:workers";
import { Ok } from "@vspo-lab/error";
import {
  type AppWorkerEnv,
  zAppWorkerEnv,
} from "../../../../config/env/internal";
import type { DiscordServer } from "../../../../domain/discord";
import { TargetLangSchema } from "../../../../domain/translate";
import { cacheKey } from "../../../../infra/cache";
import {
  createCommandContainer,
  createQueryContainer,
} from "../../../../infra/dependency/index.js";
import { withTracer, withTracerResult } from "../../../../infra/http/trace";
import { queueHandler } from "../../../../infra/queue/handler";

import type {
  BatchUpsertClipsParam,
  FetchClipsByCreatorParams,
  ListClipsQuery,
  ListClipsResponse,
} from "../../../../usecase/clip";
import type {
  BatchUpsertCreatorsParam,
  ListByMemberTypeParam,
  ListCreatorsResponse,
  SearchByChannelIdsParam,
  SearchByMemberTypeParam,
  TranslateCreatorParam,
} from "../../../../usecase/creator";
import type {
  AdjustBotChannelParams,
  BatchUpsertDiscordServersParam,
  ListDiscordServerParam,
  SendAdminMessageParams,
  SendMessageParams,
} from "../../../../usecase/discord";
import type {
  BatchUpsertEventParam,
  ListEventsQuery,
  ListEventsResponse,
  UpsertEventParam,
} from "../../../../usecase/event";
import type { ListFreechatsQuery } from "../../../../usecase/freechat";
import type {
  BatchDeleteByStreamIdsParam,
  BatchUpsertStreamsParam,
  ListParam,
  ListResponse,
  SearchByStreamIdsAndCreateParam,
  TranslateStreamParam,
} from "../../../../usecase/stream";

// Utility function to safely send batches respecting size limits
export async function safeSendBatch<T, U>(
  items: { body: U }[],
  queue: Queue<T>,
): Promise<void> {
  const MAX_BATCH_SIZE = 250000; // 256KB limit with some buffer

  // Check batch size before sending
  const batchSize = JSON.stringify(items).length;

  if (batchSize <= MAX_BATCH_SIZE) {
    // If batch size is within limit, send it
    return queue.sendBatch(items as unknown as { body: T }[]);
  }

  // Split the batch in half and process each half separately
  const midpoint = Math.ceil(items.length / 2);
  const firstHalf = items.slice(0, midpoint);
  const secondHalf = items.slice(midpoint);

  // Recursively process both halves
  await Promise.all([
    firstHalf.length > 0 ? safeSendBatch(firstHalf, queue) : Promise.resolve(),
    secondHalf.length > 0
      ? safeSendBatch(secondHalf, queue)
      : Promise.resolve(),
  ]);
}

export async function batchEnqueueWithChunks<T, U>(
  items: T[],
  chunkSize: number,
  transform: (item: T) => { body: U },
  queue: Queue<U>,
): Promise<void> {
  const MAX_BATCH_SIZE = 240000; // 256KB limit with more buffer

  // Process an array of items of any size
  const processItems = async (chunk: T[]): Promise<void> => {
    // For very small chunks, just process directly
    if (chunk.length <= 1) {
      await queue.sendBatch(chunk.map(transform));
      return;
    }

    // For larger chunks, check the serialized size first
    const transformedMessages = chunk.map(transform);
    const batchSize = JSON.stringify(transformedMessages).length;

    if (batchSize <= MAX_BATCH_SIZE) {
      // If size is ok, send the batch
      await queue.sendBatch(transformedMessages);
      return;
    }

    // If too large, split the chunk in half and process recursively
    const midpoint = Math.ceil(chunk.length / 2);
    const firstHalf = chunk.slice(0, midpoint);
    const secondHalf = chunk.slice(midpoint);

    await Promise.all([processItems(firstHalf), processItems(secondHalf)]);
  };

  // First split items into initial chunks by count
  const initialChunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    initialChunks.push(items.slice(i, i + chunkSize));
  }

  // Process each initial chunk, which may get further subdivided if needed
  await Promise.all(initialChunks.map(processItems));
}

// Stream Query Service
export class StreamQueryService extends WorkerEntrypoint<AppWorkerEnv> {
  async searchLive() {
    return withTracerResult("StreamQueryService", "searchLive", async () => {
      const d = this.setup();
      return d.streamQueryService.searchLive();
    });
  }

  async searchExist() {
    return withTracerResult("StreamQueryService", "searchExist", async () => {
      const d = this.setup();
      return d.streamQueryService.searchExist();
    });
  }

  async list(params: ListParam) {
    return withTracerResult("StreamQueryService", "list", async () => {
      const d = this.setup();
      const key = cacheKey.streamList(params);
      const cache = await d.cacheClient.get(key, {
        type: "json",
      });
      const cacheVal = cache.val as ListResponse | null;
      if (!cache.err && cacheVal) {
        return Ok(cacheVal);
      }

      const result = await d.streamQueryService.list(params);
      if (result.err) {
        return result;
      }

      this.ctx.waitUntil(d.cacheClient.set(key, result.val, 60));
      return result;
    });
  }

  async searchDeletedCheck() {
    return withTracerResult(
      "StreamQueryService",
      "searchDeletedCheck",
      async () => {
        const d = this.setup();
        return d.streamQueryService.searchDeletedCheck();
      },
    );
  }

  async getMemberStreams() {
    return withTracerResult(
      "StreamQueryService",
      "getMemberStreams",
      async () => {
        const d = this.setup();
        return d.streamQueryService.getMemberStreams();
      },
    );
  }

  async deletedListIds() {
    return withTracerResult(
      "StreamQueryService",
      "deletedListIds",
      async () => {
        const d = this.setup();
        return d.streamQueryService.deletedListIds();
      },
    );
  }

  private setup() {
    const e = zAppWorkerEnv.safeParse(this.env);
    if (!e.success) {
      throw new Error(e.error.message);
    }
    return createQueryContainer(e.data);
  }
}

// Stream Command Service
export class StreamCommandService extends WorkerEntrypoint<AppWorkerEnv> {
  async batchUpsertEnqueue(params: BatchUpsertStreamsParam) {
    return withTracer(
      "StreamCommandService",
      "batchUpsertEnqueue",
      async () => {
        return batchEnqueueWithChunks(
          params,
          50,
          (stream) => ({ body: { ...stream, kind: "upsert-stream" as const } }),
          this.env.WRITE_QUEUE,
        );
      },
    );
  }

  async batchUpsert(params: BatchUpsertStreamsParam) {
    return withTracerResult("StreamCommandService", "batchUpsert", async () => {
      const d = this.setup();
      return d.streamInteractor.batchUpsert(params);
    });
  }

  async batchDeleteByStreamIds(params: BatchDeleteByStreamIdsParam) {
    return withTracerResult(
      "StreamCommandService",
      "batchDeleteByStreamIds",
      async () => {
        const d = this.setup();
        return d.streamInteractor.batchDeleteByStreamIds(params);
      },
    );
  }

  async translateStreamEnqueue(params: TranslateStreamParam) {
    return withTracer(
      "StreamCommandService",
      "translateStreamEnqueue",
      async () => {
        return batchEnqueueWithChunks(
          params.streams,
          50,
          (stream) => ({
            body: {
              ...stream,
              languageCode: TargetLangSchema.parse(params.languageCode),
              kind: "translate-stream" as const,
            },
          }),
          this.env.WRITE_QUEUE,
        );
      },
    );
  }

  async searchByStreamsIdsAndCreate(params: SearchByStreamIdsAndCreateParam) {
    return withTracerResult(
      "StreamCommandService",
      "searchByStreamsIdsAndCreate",
      async () => {
        const d = this.setup();
        return d.streamInteractor.searchByStreamsIdsAndCreate(params);
      },
    );
  }

  private setup() {
    const e = zAppWorkerEnv.safeParse(this.env);
    if (!e.success) {
      throw new Error(e.error.message);
    }
    // Command Services need interactors

    return createCommandContainer(e.data);
  }
}

// Clip Query Service
export class ClipQueryService extends WorkerEntrypoint<AppWorkerEnv> {
  private setup() {
    const e = zAppWorkerEnv.safeParse(this.env);
    if (!e.success) {
      throw new Error(e.error.message);
    }
    return createQueryContainer(e.data);
  }

  async list(params: ListClipsQuery) {
    return withTracerResult("ClipQueryService", "list", async () => {
      const d = this.setup();
      const key = cacheKey.clipList(params);
      const cache = await d.cacheClient.get(key, {
        type: "json",
      });
      const cacheVal = cache.val as ListClipsResponse | null;
      if (!cache.err && cacheVal) {
        return Ok(cacheVal);
      }

      const result = await d.clipQueryService.list(params);
      if (result.err) {
        return result;
      }

      this.ctx.waitUntil(d.cacheClient.set(key, result.val, 3600));
      return result;
    });
  }

  async searchNewVspoClipsAndNewCreators() {
    return withTracerResult(
      "ClipQueryService",
      "searchNewVspoClipsAndNewCreators",
      async () => {
        const d = this.setup();
        const clips =
          await d.clipQueryService.searchNewVspoClipsAndNewCreators();
        if (clips.err) {
          return clips;
        }
        // Note: The query service returns only clips, not newCreators
        // The interactor needs the full response for backward compatibility
        const channelIds = clips.val
          .map((clip) => clip.rawChannelID)
          .filter(Boolean);
        const creators = await d.creatorQueryService.searchByChannelIds({
          channelIds,
        });
        if (creators.err) {
          return creators;
        }
        return Ok({ newCreators: creators.val, clips: clips.val });
      },
    );
  }

  async searchExistVspoClips({ clipIds }: { clipIds: string[] }) {
    return withTracerResult(
      "ClipQueryService",
      "searchExistVspoClips",
      async () => {
        const d = this.setup();
        const clips = await d.clipQueryService.searchExistVspoClips({
          clipIds,
        });
        if (clips.err) {
          return clips;
        }
        // Calculate notExistsClipIds
        const existingIds = new Set(clips.val.map((clip) => clip.id));
        const notExistsClipIds = clipIds.filter((id) => !existingIds.has(id));
        return Ok({ clips: clips.val, notExistsClipIds });
      },
    );
  }

  async searchNewClipsByVspoMemberName() {
    return withTracerResult(
      "ClipQueryService",
      "searchNewClipsByVspoMemberName",
      async () => {
        const d = this.setup();
        const clips = await d.clipQueryService.searchNewClipsByVspoMemberName();
        if (clips.err) {
          return clips;
        }
        // Note: The query service returns only clips, not newCreators
        // The interactor needs the full response for backward compatibility
        const channelIds = clips.val
          .map((clip) => clip.rawChannelID)
          .filter(Boolean);
        const creators = await d.creatorQueryService.searchByChannelIds({
          channelIds,
        });
        if (creators.err) {
          return creators;
        }
        return Ok({ newCreators: creators.val, clips: clips.val });
      },
    );
  }

  async fetchClipsByCreator(params: FetchClipsByCreatorParams) {
    return withTracerResult(
      "ClipQueryService",
      "fetchClipsByCreator",
      async () => {
        const e = zAppWorkerEnv.safeParse(this.env);
        if (!e.success) {
          throw new Error(e.error.message);
        }
        const commandContainer = createCommandContainer(e.data);
        return commandContainer.clipInteractor.fetchClipsByCreator(params);
      },
    );
  }
}

// Clip Command Service
export class ClipCommandService extends WorkerEntrypoint<AppWorkerEnv> {
  async batchUpsertEnqueue(params: BatchUpsertClipsParam) {
    return withTracer("ClipCommandService", "batchUpsertEnqueue", async () => {
      return batchEnqueueWithChunks(
        params,
        50,
        (clip) => ({ body: { ...clip, kind: "upsert-clip" as const } }),
        this.env.WRITE_QUEUE,
      );
    });
  }

  async batchUpsert(params: BatchUpsertClipsParam) {
    return withTracerResult("ClipCommandService", "batchUpsert", async () => {
      const d = this.setup();
      return d.clipInteractor.batchUpsert(params);
    });
  }

  async deleteClips({ clipIds }: { clipIds: string[] }) {
    return withTracerResult("ClipCommandService", "deleteClips", async () => {
      const d = this.setup();
      return d.clipInteractor.deleteClips({ clipIds });
    });
  }

  async fetchClipsByCreatorEnqueue(params: FetchClipsByCreatorParams) {
    return withTracer(
      "ClipCommandService",
      "fetchClipsByCreatorEnqueue",
      async () => {
        await this.env.WRITE_QUEUE.send({
          ...params,
          kind: "fetch-clips-by-creator" as const,
        });
      },
    );
  }

  private setup() {
    const e = zAppWorkerEnv.safeParse(this.env);
    if (!e.success) {
      throw new Error(e.error.message);
    }
    // Command Services need interactors

    return createCommandContainer(e.data);
  }
}

// Creator Query Service
export class CreatorQueryService extends WorkerEntrypoint<AppWorkerEnv> {
  private setup() {
    const e = zAppWorkerEnv.safeParse(this.env);
    if (!e.success) {
      throw new Error(e.error.message);
    }
    return createQueryContainer(e.data);
  }

  async searchByChannelIds(params: SearchByChannelIdsParam) {
    return withTracerResult(
      "CreatorQueryService",
      "searchByChannelIds",
      async () => {
        const d = this.setup();
        // Convert from usecase format to query-service format
        const channelIds = params.channel.map((ch) => ch.id);
        return d.creatorQueryService.searchByChannelIds({ channelIds });
      },
    );
  }

  async searchByMemberType(params: SearchByMemberTypeParam) {
    return withTracerResult(
      "CreatorQueryService",
      "searchByMemberType",
      async () => {
        const d = this.setup();
        return d.creatorQueryService.searchByMemberType(params);
      },
    );
  }

  async list(params: ListByMemberTypeParam) {
    return withTracerResult("CreatorQueryService", "list", async () => {
      const d = this.setup();
      const key = cacheKey.creatorList(params);
      const cache = await d.cacheClient.get(key, {
        type: "json",
      });
      const cacheVal = cache.val as ListCreatorsResponse | null;
      if (!cache.err && cacheVal) {
        return Ok(cacheVal);
      }

      const result = await d.creatorQueryService.list({
        ...params,
        languageCode: params.languageCode || "ja",
      });
      if (result.err) {
        return result;
      }

      this.ctx.waitUntil(d.cacheClient.set(key, result.val, 3600));
      return result;
    });
  }
}

// Creator Command Service
export class CreatorCommandService extends WorkerEntrypoint<AppWorkerEnv> {
  async batchUpsertEnqueue(params: BatchUpsertCreatorsParam) {
    return withTracer(
      "CreatorCommandService",
      "batchUpsertEnqueue",
      async () => {
        return batchEnqueueWithChunks(
          params,
          50,
          (creator) => ({
            body: { ...creator, kind: "upsert-creator" as const },
          }),
          this.env.WRITE_QUEUE,
        );
      },
    );
  }

  async translateCreatorEnqueue(params: TranslateCreatorParam) {
    return withTracer(
      "CreatorCommandService",
      "translateCreatorEnqueue",
      async () => {
        return batchEnqueueWithChunks(
          params.creators,
          50,
          (creator) => ({
            body: {
              ...creator,
              languageCode: params.languageCode,
              kind: "translate-creator" as const,
            },
          }),
          this.env.WRITE_QUEUE,
        );
      },
    );
  }

  private setup() {
    const e = zAppWorkerEnv.safeParse(this.env);
    if (!e.success) {
      throw new Error(e.error.message);
    }
    // Command Services need interactors

    return createCommandContainer(e.data);
  }
}

// Discord Query Service
export class DiscordQueryService extends WorkerEntrypoint<AppWorkerEnv> {
  private setup() {
    const e = zAppWorkerEnv.safeParse(this.env);
    if (!e.success) {
      throw new Error(e.error.message);
    }
    return createQueryContainer(e.data);
  }

  async get(serverId: string) {
    return withTracerResult("DiscordQueryService", "get", async () => {
      const d = this.setup();
      const key = cacheKey.discordServer(serverId);
      const cache = await d.cacheClient.get(key, {
        type: "json",
      });
      const cacheVal = cache.val as DiscordServer | null;
      if (!cache.err && cacheVal) {
        return Ok(cacheVal);
      }

      const result = await d.discordQueryService.get(serverId);
      if (result.err) {
        return result;
      }
      this.ctx.waitUntil(d.cacheClient.set(key, result.val, 3600));
      return result;
    });
  }

  async list(params: ListDiscordServerParam) {
    return withTracerResult("DiscordQueryService", "list", async () => {
      const d = this.setup();
      return d.discordQueryService.list(params);
    });
  }

  async exists(serverId: string) {
    return withTracerResult("DiscordQueryService", "exists", async () => {
      const d = this.setup();
      return d.discordQueryService.exists(serverId);
    });
  }

  async existsChannel(channelId: string) {
    return withTracerResult(
      "DiscordQueryService",
      "existsChannel",
      async () => {
        const d = this.setup();
        return d.discordQueryService.existsChannel(channelId);
      },
    );
  }
}

// Discord Command Service
export class DiscordCommandService extends WorkerEntrypoint<AppWorkerEnv> {
  async sendStreamsToMultipleChannels(params: SendMessageParams) {
    return withTracerResult(
      "DiscordCommandService",
      "sendStreamsToMultipleChannels",
      async () => {
        const d = this.setup();
        return d.discordInteractor.batchSendMessages(params);
      },
    );
  }

  async adjustBotChannel(params: AdjustBotChannelParams) {
    return withTracerResult(
      "DiscordCommandService",
      "adjustBotChannel",
      async () => {
        const d = this.setup();
        return d.discordInteractor.adjustBotChannel(params);
      },
    );
  }

  async batchUpsertEnqueue(params: BatchUpsertDiscordServersParam) {
    return withTracer(
      "DiscordCommandService",
      "batchUpsertEnqueue",
      async () => {
        return batchEnqueueWithChunks(
          params,
          50,
          (server) => ({
            body: { ...server, kind: "upsert-discord-server" as const },
          }),
          this.env.WRITE_QUEUE,
        );
      },
    );
  }

  async batchDeleteChannelsByRowChannelIds(params: string[]) {
    return withTracerResult(
      "DiscordCommandService",
      "batchDeleteChannelsByRowChannelIds",
      async () => {
        const d = this.setup();
        return d.discordInteractor.batchDeleteChannelsByRowChannelIds(params);
      },
    );
  }

  async deleteAllMessagesInChannel(channelId: string) {
    return withTracerResult(
      "DiscordCommandService",
      "deleteAllMessagesInChannel",
      async () => {
        const d = this.setup();
        return d.discordInteractor.deleteAllMessagesInChannel(channelId);
      },
    );
  }

  async sendAdminMessage(message: SendAdminMessageParams) {
    return withTracerResult(
      "DiscordCommandService",
      "sendAdminMessage",
      async () => {
        const d = this.setup();
        return d.discordInteractor.sendAdminMessage(message);
      },
    );
  }

  async deleteMessageInChannelEnqueue(channelId: string) {
    return withTracer(
      "DiscordCommandService",
      "deleteMessageInChannelEnqueue",
      async () => {
        return batchEnqueueWithChunks(
          [channelId],
          50,
          (channelId) => ({
            body: { channelId, kind: "delete-message-in-channel" as const },
          }),
          this.env.WRITE_QUEUE,
        );
      },
    );
  }

  private setup() {
    const e = zAppWorkerEnv.safeParse(this.env);
    if (!e.success) {
      throw new Error(e.error.message);
    }
    // Command Services need interactors

    return createCommandContainer(e.data);
  }
}

// Event Query Service
export class EventQueryService extends WorkerEntrypoint<AppWorkerEnv> {
  private setup() {
    const e = zAppWorkerEnv.safeParse(this.env);
    if (!e.success) {
      throw new Error(e.error.message);
    }
    return createQueryContainer(e.data);
  }

  async list(params: ListEventsQuery) {
    return withTracerResult("EventQueryService", "list", async () => {
      const d = this.setup();
      const key = cacheKey.eventList(params);
      const cache = await d.cacheClient.get(key, {
        type: "json",
      });
      const cacheVal = cache.val as ListEventsResponse | null;
      if (!cache.err && cacheVal) {
        return Ok(cacheVal);
      }

      const result = await d.eventQueryService.list({
        ...params,
        languageCode: "ja",
      });
      if (result.err) {
        return result;
      }

      this.ctx.waitUntil(d.cacheClient.set(key, result.val, 3600));
      return result;
    });
  }

  async get(id: string) {
    return withTracerResult("EventQueryService", "get", async () => {
      const d = this.setup();
      return d.eventQueryService.get(id);
    });
  }
}

// Event Command Service
export class EventCommandService extends WorkerEntrypoint<AppWorkerEnv> {
  async upsert(params: UpsertEventParam) {
    return withTracerResult("EventCommandService", "upsert", async () => {
      const d = this.setup();
      return d.eventInteractor.upsert(params);
    });
  }

  async delete(id: string) {
    return withTracerResult("EventCommandService", "delete", async () => {
      const d = this.setup();
      return d.eventInteractor.delete(id);
    });
  }

  async batchDelete(ids: string[]) {
    return withTracerResult("EventCommandService", "batchDelete", async () => {
      const d = this.setup();
      return d.eventInteractor.batchDelete(ids);
    });
  }

  async batchUpsert(params: BatchUpsertEventParam) {
    return withTracerResult("EventCommandService", "batchUpsert", async () => {
      const d = this.setup();
      return d.eventInteractor.batchUpsert(params);
    });
  }

  private setup() {
    const e = zAppWorkerEnv.safeParse(this.env);
    if (!e.success) {
      throw new Error(e.error.message);
    }
    // Command Services need interactors

    return createCommandContainer(e.data);
  }
}

// Freechat Query Service
export class FreechatQueryService extends WorkerEntrypoint<AppWorkerEnv> {
  private setup() {
    const e = zAppWorkerEnv.safeParse(this.env);
    if (!e.success) {
      throw new Error(e.error.message);
    }
    return createQueryContainer(e.data);
  }

  async list(params: ListFreechatsQuery) {
    return withTracerResult("FreechatQueryService", "list", async () => {
      const d = this.setup();
      return d.freechatQueryService.list(params);
    });
  }
}

// ClipAnalysis Query Service
export class ClipAnalysisQueryService extends WorkerEntrypoint<AppWorkerEnv> {
  private setup() {
    const e = zAppWorkerEnv.safeParse(this.env);
    if (!e.success) {
      throw new Error(e.error.message);
    }
    // Query Services need appContext

    return createQueryContainer(e.data);
  }

  async analyzeClips(limit?: number) {
    return withTracerResult(
      "ClipAnalysisQueryService",
      "analyzeClips",
      async () => {
        const e = zAppWorkerEnv.safeParse(this.env);
        if (!e.success) {
          throw new Error(e.error.message);
        }

        const commandContainer = createCommandContainer(e.data);
        return commandContainer.clipAnalysisInteractor.analyzeClips(limit);
      },
    );
  }

  async getAnalysisStats() {
    return withTracerResult(
      "ClipAnalysisQueryService",
      "getAnalysisStats",
      async () => {
        const e = zAppWorkerEnv.safeParse(this.env);
        if (!e.success) {
          throw new Error(e.error.message);
        }

        const commandContainer = createCommandContainer(e.data);
        return commandContainer.clipAnalysisInteractor.getAnalysisStats();
      },
    );
  }
}

// Export all services are already exported as class declarations above

export default queueHandler;

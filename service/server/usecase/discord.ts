import { getCurrentUTCString } from "@vspo-lab/dayjs";
import { type AppError, Ok, type Result } from "@vspo-lab/error";
import {
  createDiscordMessage,
  type DiscordMessage,
  type DiscordServer,
  type DiscordServers,
} from "../domain/discord";
import { createPage, type Page } from "../domain/pagination";
import type { IAppContext } from "../infra/dependency";
import { withTracerResult } from "../infra/http/trace";
import { createUUID } from "../pkg/uuid";

export type SendMessageParams = {
  channelIds: string[];
  channelLangaugeCode: string;
  channelMemberType:
    | "vspo_jp"
    | "vspo_en"
    | "vspo_ch"
    | "vspo_all"
    | "general"
    | "custom";
  selectedMemberIds?: string[];
};

export type AdjustBotChannelParams = {
  type: "add" | "remove";
  serverId: string;
  targetChannelId: string;
  serverLangaugeCode?: string;
  channelLangaugeCode?: string;
  memberType?:
    | "vspo_jp"
    | "vspo_en"
    | "vspo_ch"
    | "vspo_all"
    | "general"
    | "custom";
  selectedMemberIds?: string[];
};

export type ListDiscordServerParam = {
  limit: number;
  page: number;
};

export type ListDiscordServerResponse = {
  discordServers: DiscordServers;
  pagination: Page;
};

export type BatchUpsertDiscordServersParam = DiscordServers;

export type SendAdminMessageParams = {
  channelId: string;
  content: string;
};

export type DeletedChannelCheckParams = {
  serverId: string;
  channelId: string;
};

export interface IDiscordInteractor {
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

export const createDiscordInteractor = (
  context: IAppContext,
): IDiscordInteractor => {
  const INTERACTOR_NAME = "DiscordInteractor";

  const list = async (
    params: ListDiscordServerParam,
  ): Promise<Result<ListDiscordServerResponse, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "list", async () => {
      return context.runInTx(async (repos, _services) => {
        const sv = await repos.discordServerRepository.list(params);
        if (sv.err) {
          return sv;
        }

        const count = await repos.discordServerRepository.count(params);
        if (count.err) {
          return count;
        }
        return Ok({
          discordServers: sv.val,
          pagination: createPage({
            currentPage: params.page,
            limit: params.limit,
            totalCount: count.val,
          }),
        });
      });
    });
  };

  const get = async (
    serverId: string,
  ): Promise<Result<DiscordServer, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "get", async () => {
      return context.runInTx(async (repos, _services) => {
        const sv = await repos.discordServerRepository.get({ serverId });
        if (sv.err) {
          return sv;
        }
        return Ok(sv.val);
      });
    });
  };

  const exists = async (
    serverId: string,
  ): Promise<Result<boolean, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "exists", async () => {
      return context.runInTx(async (repos, _services) => {
        return await repos.discordServerRepository.exists({ serverId });
      });
    });
  };

  const batchSendMessages = async (
    params: SendMessageParams,
  ): Promise<Result<void, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "batchSendMessages",
      async () => {
        return context.runInTx(async (_repos, services) => {
          const v = await services.discordService.sendMessagesToChannel(params);

          if (v.err) {
            return v;
          }

          return Ok();
        });
      },
    );
  };

  const deleteAllMessagesInChannel = async (
    channelId: string,
  ): Promise<Result<void, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "deleteAllMessagesInChannel",
      async () => {
        return context.runInTx(async (_repos, services) => {
          const sv =
            await services.discordService.deleteAllMessagesInChannel(channelId);
          if (sv.err) {
            return sv;
          }
          return Ok();
        });
      },
    );
  };

  const adjustBotChannel = async (
    params: AdjustBotChannelParams,
  ): Promise<Result<DiscordServer, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "adjustBotChannel",
      async () => {
        return context.runInTx(async (_repos, services) => {
          const sv = await services.discordService.adjustBotChannel(params);
          if (sv.err) {
            return sv;
          }
          return Ok(sv.val);
        });
      },
    );
  };

  const batchUpsert = async (
    params: BatchUpsertDiscordServersParam,
  ): Promise<Result<DiscordServers, AppError>> => {
    return await withTracerResult(INTERACTOR_NAME, "batchUpsert", async () => {
      return context.runInTx(async (repos, _services) => {
        const sv = await repos.discordServerRepository.batchUpsert(params);
        if (sv.err) {
          return sv;
        }
        return Ok(sv.val);
      });
    });
  };

  const batchDeleteChannelsByRowChannelIds = async (
    channelIds: string[],
  ): Promise<Result<void, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "batchDeleteChannelsByRowChannelIds",
      async () => {
        return context.runInTx(async (repos, _services) => {
          const sv =
            await repos.discordServerRepository.batchDeleteChannelsByRowChannelIds(
              channelIds,
            );
          if (sv.err) {
            return sv;
          }
          return Ok();
        });
      },
    );
  };

  const existsChannel = async (
    channelId: string,
  ): Promise<Result<boolean, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "existsChannel",
      async () => {
        return context.runInTx(async (repos, _services) => {
          return await repos.discordServerRepository.existsChannel({
            channelId,
          });
        });
      },
    );
  };

  const sendAdminMessage = async (
    message: SendAdminMessageParams,
  ): Promise<Result<DiscordMessage, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "sendAdminMessage",
      async () => {
        return context.runInTx(async (repos, _services) => {
          const sv = await _services.discordService.sendAdminMessage(message);
          if (sv.err) {
            return sv;
          }

          const now = getCurrentUTCString();
          return await repos.discordMessageRepository.create(
            createDiscordMessage({
              id: createUUID(),
              type: "admin",
              rawId: sv.val,
              channelId: message.channelId,
              content: message.content,
              embedStreams: [],
              createdAt: now,
              updatedAt: now,
            }),
          );
        });
      },
    );
  };

  const isDeletedChannel = async (
    params: DeletedChannelCheckParams,
  ): Promise<Result<boolean, AppError>> => {
    return await withTracerResult(
      INTERACTOR_NAME,
      "isDeletedChannel",
      async () => {
        return context.runInTx(async (_repos, services) => {
          const sv = await services.discordService.isDeletedChannel(params);
          if (sv.err) {
            return sv;
          }
          return Ok(sv.val);
        });
      },
    );
  };

  return {
    batchSendMessages,
    adjustBotChannel,
    get,
    list,
    deleteAllMessagesInChannel,
    batchUpsert,
    batchDeleteChannelsByRowChannelIds,
    exists,
    existsChannel,
    sendAdminMessage,
    isDeletedChannel,
  };
};

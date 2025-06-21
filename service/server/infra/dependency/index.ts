import type { AppError, Result } from "@vspo-lab/error";
import type { PgTransactionConfig } from "drizzle-orm/pg-core";
import {
  type ICreatorClipFetchService,
  type ICreatorService,
  type IStreamService,
  createCreatorClipFetchService,
  createCreatorService,
  createStreamService,
} from "../../domain";
import { type IBilibiliService, createBilibiliService } from "../bilibili";
import {
  type DB,
  type ICreatorRepository,
  type IDiscordMessageRepository,
  type IDiscordServerRepository,
  type IFreechatRepository,
  type IStreamRepository,
  type ITxManager,
  createCreatorRepository,
  createDiscordMessageRepository,
  createDiscordServerRepository,
  createFreechatRepository,
  createStreamRepository,
  createTxManager,
} from "../repository";
import {
  type ITwitcastingService,
  createTwitcastingService,
} from "../twitcasting";
import { type ITwitchService, createTwitchService } from "../twitch";
import { type IYoutubeService, createYoutubeService } from "../youtube";

import type { AppWorkerEnv } from "../../config/env/internal";
import {
  type IClipService,
  createClipService,
} from "../../domain/service/clip";
import {
  type IClipAnalysisService,
  createClipAnalysisService,
} from "../../domain/service/clipAnalysis";
import {
  type IDiscordService,
  createDiscordService,
} from "../../domain/service/discord";
import {
  type ICreatorInteractor,
  type IEventInteractor,
  type IStreamInteractor,
  createCreatorInteractor,
  createEventInteractor,
  createStreamInteractor,
} from "../../usecase";
import { type IClipInteractor, createClipInteractor } from "../../usecase/clip";
import {
  type IClipAnalysisInteractor,
  createClipAnalysisInteractor,
} from "../../usecase/clipAnalysis";
import {
  type ICreatorClipFetchInteractor,
  createCreatorClipFetchInteractor,
} from "../../usecase/creatorClipFetch";
import {
  type IDiscordInteractor,
  createDiscordInteractor,
} from "../../usecase/discord";
import {
  type IFreechatInteractor,
  createFreechatInteractor,
} from "../../usecase/freechat";
import { type IAIService, createAIService } from "../ai";
import { type ICacheClient, createCloudflareKVCacheClient } from "../cache";
import { type IDiscordClient, createDiscordClient } from "../discord";
import { type IMastraService, createMastraService } from "../mastra";
import { type IClipRepository, createClipRepository } from "../repository/clip";
import {
  type IClipAnalysisRepository,
  createClipAnalysisRepository,
} from "../repository/clipAnalysis";
import {
  type IEventRepository,
  createEventRepository,
} from "../repository/event";

export interface IRepositories {
  creatorRepository: ICreatorRepository;
  streamRepository: IStreamRepository;
  discordServerRepository: IDiscordServerRepository;
  discordMessageRepository: IDiscordMessageRepository;
  clipRepository: IClipRepository;
  clipAnalysisRepository: IClipAnalysisRepository;
  eventRepository: IEventRepository;
  freechatRepository: IFreechatRepository;
}

export function createRepositories(tx: DB): IRepositories {
  return {
    creatorRepository: createCreatorRepository(tx),
    streamRepository: createStreamRepository(tx),
    discordServerRepository: createDiscordServerRepository(tx),
    discordMessageRepository: createDiscordMessageRepository(tx),
    clipRepository: createClipRepository(tx),
    clipAnalysisRepository: createClipAnalysisRepository(tx),
    eventRepository: createEventRepository(tx),
    freechatRepository: createFreechatRepository(tx),
  };
}

export interface IServices {
  creatorService: ICreatorService;
  streamService: IStreamService;
  discordService: IDiscordService;
  clipService: IClipService;
  clipAnalysisService: IClipAnalysisService;
  creatorClipFetchService: ICreatorClipFetchService;
}

export function createServices(
  repos: IRepositories,
  youtubeClient: IYoutubeService,
  twitchClient: ITwitchService,
  twitcastingClient: ITwitcastingService,
  bilibiliClient: IBilibiliService,
  aiService: IAIService,
  discordClient: IDiscordClient,
  cacheClient: ICacheClient,
  mastraService: IMastraService,
): IServices {
  return {
    creatorService: createCreatorService({
      youtubeClient,
      creatorRepository: repos.creatorRepository,
      aiService,
      cacheClient,
    }),
    streamService: createStreamService({
      youtubeClient,
      twitchClient,
      twitCastingClient: twitcastingClient,
      bilibiliClient,
      creatorRepository: repos.creatorRepository,
      streamRepository: repos.streamRepository,
      aiService,
      cacheClient,
    }),
    discordService: createDiscordService({
      discordServerRepository: repos.discordServerRepository,
      discordClient: discordClient,
      streamRepository: repos.streamRepository,
      discordMessageRepository: repos.discordMessageRepository,
      cacheClient,
    }),
    clipService: createClipService({
      youtubeClient,
      twitchClient,
      creatorRepository: repos.creatorRepository,
    }),
    clipAnalysisService: createClipAnalysisService({
      mastraService,
      clipRepository: repos.clipRepository,
      clipAnalysisRepository: repos.clipAnalysisRepository,
    }),
    creatorClipFetchService: createCreatorClipFetchService({
      youtubeClient,
    }),
  };
}

export interface IAppContext {
  runInTx<T>(
    operation: (
      repos: IRepositories,
      services: IServices,
    ) => Promise<Result<T, AppError>>,
  ): Promise<Result<T, AppError>>;
}

export const createAppContext = (
  txManager: ITxManager,
  youtubeClient: IYoutubeService,
  twitchClient: ITwitchService,
  twitcastingClient: ITwitcastingService,
  bilibiliClient: IBilibiliService,
  aiService: IAIService,
  discordClient: IDiscordClient,
  cacheClient: ICacheClient,
  mastraService: IMastraService,
): IAppContext => {
  const runInTx = async <T>(
    operation: (
      repos: IRepositories,
      services: IServices,
    ) => Promise<Result<T, AppError>>,
    config?: PgTransactionConfig,
  ): Promise<Result<T, AppError>> => {
    return txManager.runTx(async (tx) => {
      const repos = createRepositories(tx);

      const services = createServices(
        repos,
        youtubeClient,
        twitchClient,
        twitcastingClient,
        bilibiliClient,
        aiService,
        discordClient,
        cacheClient,
        mastraService,
      );

      return operation(repos, services);
    }, config);
  };

  return { runInTx };
};

export interface IContainer {
  readonly cacheClient: ICacheClient;
  readonly creatorInteractor: ICreatorInteractor;
  readonly streamInteractor: IStreamInteractor;
  readonly clipInteractor: IClipInteractor;
  readonly clipAnalysisInteractor: IClipAnalysisInteractor;
  readonly creatorClipFetchInteractor: ICreatorClipFetchInteractor;
  readonly discordInteractor: IDiscordInteractor;
  readonly eventInteractor: IEventInteractor;
  readonly freechatInteractor: IFreechatInteractor;
}

export const createContainer = (env: AppWorkerEnv): IContainer => {
  const cacheClient = createCloudflareKVCacheClient(env.APP_KV);

  const youtubeService = createYoutubeService(env.YOUTUBE_API_KEY);
  const twitchService = createTwitchService({
    clientId: env.TWITCH_CLIENT_ID,
    clientSecret: env.TWITCH_CLIENT_SECRET,
  });
  const bilibiliService = createBilibiliService();
  const twitcastingService = createTwitcastingService({
    clientId: env.TWITCASTING_CLIENT_ID,
    clientSecret: env.TWITCASTING_CLIENT_SECRET,
  });
  const txManager = createTxManager({
    connectionString:
      env.ENVIRONMENT === "local"
        ? env.DEV_DB_CONNECTION_STRING
        : env.DB.connectionString,
    isQueryLoggingEnabled: env.ENVIRONMENT === "local",
  });
  const aiService = createAIService({
    apiKey: env.OPENAI_API_KEY,
    organization: env.OPENAI_ORGANIZATION,
    project: env.OPENAI_PROJECT,
    baseURL: env.OPENAI_BASE_URL,
  });

  const mastraService = createMastraService({
    baseUrl: env.MASTRA_BASE_URL,
    agentId: env.MASTRA_AGENT_ID,
    cfAccessClientId: env.MASTRA_CF_ACCESS_CLIENT_ID,
    cfAccessClientSecret: env.MASTRA_CF_ACCESS_CLIENT_SECRET,
  });

  const discordClient = createDiscordClient(env);
  const context = createAppContext(
    txManager,
    youtubeService,
    twitchService,
    twitcastingService,
    bilibiliService,
    aiService,
    discordClient,
    cacheClient,
    mastraService,
  );
  const creatorInteractor = createCreatorInteractor(context);
  const streamInteractor = createStreamInteractor(context);
  const discordInteractor = createDiscordInteractor(context);
  const clipInteractor = createClipInteractor(context);
  const clipAnalysisInteractor = createClipAnalysisInteractor(context);
  const creatorClipFetchInteractor = createCreatorClipFetchInteractor(context);
  const eventInteractor = createEventInteractor(context);
  const freechatInteractor = createFreechatInteractor(context);

  return {
    cacheClient,
    creatorInteractor,
    streamInteractor,
    clipInteractor,
    clipAnalysisInteractor,
    creatorClipFetchInteractor,
    discordInteractor,
    eventInteractor,
    freechatInteractor,
  };
};

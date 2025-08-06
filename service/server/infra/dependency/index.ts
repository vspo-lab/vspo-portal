import type { AppError, Result } from "@vspo-lab/error";
import { AppLogger } from "@vspo-lab/logging";
import type { PgTransactionConfig } from "drizzle-orm/pg-core";
// Temporary import for CQRS migration
import { StreamInteractorCQRSAdapter } from "../../cmd/server/internal/cqrs/stream";
import type { AppWorkerEnv } from "../../config/env/internal";
import {
  createClipService,
  type IClipService,
} from "../../domain/service/clip";
import {
  createClipAnalysisService,
  type IClipAnalysisService,
} from "../../domain/service/clipAnalysis";
import {
  createCreatorService,
  type ICreatorService,
} from "../../domain/service/creator";
import {
  createCreatorClipFetchService,
  type ICreatorClipFetchService,
} from "../../domain/service/creatorClipFetch";
import {
  createDiscordService,
  type IDiscordService,
} from "../../domain/service/discord";
import {
  createStreamService,
  type IStreamService,
} from "../../domain/service/stream";
import { createClipInteractor, type IClipInteractor } from "../../usecase/clip";
import {
  createClipAnalysisInteractor,
  type IClipAnalysisInteractor,
} from "../../usecase/clipAnalysis";
import {
  createCreatorInteractor,
  type ICreatorInteractor,
} from "../../usecase/creator";
import {
  createDiscordInteractor,
  type IDiscordInteractor,
} from "../../usecase/discord";
import {
  createEventInteractor,
  type IEventInteractor,
} from "../../usecase/event";
import {
  createFreechatInteractor,
  type IFreechatInteractor,
} from "../../usecase/freechat";
import {
  createStreamInteractor,
  type IStreamInteractor,
} from "../../usecase/stream";
import { createAIService, type IAIService } from "../ai";
import { createBilibiliService, type IBilibiliService } from "../bilibili";
import { createCloudflareKVCacheClient, type ICacheClient } from "../cache";
import { createDiscordClient, type IDiscordClient } from "../discord";
import { createMastraService, type IMastraService } from "../mastra";
import { createClipRepository, type IClipRepository } from "../repository/clip";
import {
  createClipAnalysisRepository,
  type IClipAnalysisRepository,
} from "../repository/clipAnalysis";
import {
  createCreatorRepository,
  type ICreatorRepository,
} from "../repository/creator";
import {
  createDiscordServerRepository,
  type IDiscordServerRepository,
} from "../repository/discord";
import {
  createDiscordMessageRepository,
  type IDiscordMessageRepository,
} from "../repository/discordMessage";
import {
  createEventRepository,
  type IEventRepository,
} from "../repository/event";
import {
  createFreechatRepository,
  type IFreechatRepository,
} from "../repository/freechat";
import {
  createStreamRepository,
  type IStreamRepository,
} from "../repository/stream";
import {
  createTxManager,
  type DB,
  type ITxManager,
} from "../repository/transaction";
import {
  createTwitcastingService,
  type ITwitcastingService,
} from "../twitcasting";
import { createTwitchService, type ITwitchService } from "../twitch";
import { createYoutubeService, type IYoutubeService } from "../youtube";

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
  const creatorClipFetchService = createCreatorClipFetchService({
    youtubeClient,
  });

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
      creatorClipFetchService,
    }),
    clipAnalysisService: createClipAnalysisService({
      mastraService,
      clipRepository: repos.clipRepository,
      clipAnalysisRepository: repos.clipAnalysisRepository,
    }),
    creatorClipFetchService,
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
  // Use CQRS adapter for stream if feature flag is enabled
  const streamInteractor = env.USE_CQRS_STREAM
    ? new StreamInteractorCQRSAdapter(context)
    : createStreamInteractor(context);
  const discordInteractor = createDiscordInteractor(context);
  const clipInteractor = createClipInteractor(context);
  const clipAnalysisInteractor = createClipAnalysisInteractor(context);
  const eventInteractor = createEventInteractor(context);
  const freechatInteractor = createFreechatInteractor(context);
  // init
  const _ = AppLogger.getInstance(env);
  return {
    cacheClient,
    creatorInteractor,
    streamInteractor,
    clipInteractor,
    clipAnalysisInteractor,
    discordInteractor,
    eventInteractor,
    freechatInteractor,
  };
};

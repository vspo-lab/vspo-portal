import path from "node:path";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Ok } from "@vspo-lab/error";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { afterEach, vi } from "vitest";
import { zAppWorkerEnv } from "../config/env/internal";
import { createAIService } from "../infra/ai";
import { createCloudflareKVCacheClient } from "../infra/cache";
import { createAppContext } from "../infra/dependency";
import { createDiscordClient } from "../infra/discord";
import { createMastraService } from "../infra/mastra";
import {
  channelTable,
  creatorTable,
  creatorTranslationTable,
  discordChannelTable,
  discordServerTable,
  type InsertVideo,
  streamStatusTable,
  videoTable,
  videoTranslationTable,
} from "../infra/repository/schema";
import {
  batchInsert,
  createCreatorTranslations,
  createDiscordChannels,
  createDiscordServers,
  createStreamStatuses,
  createVideosForChannel,
  createVideoTranslations,
  VSPO_MEMBER_CHANNEL_IDS,
  VSPO_MEMBER_NAMES,
} from "./fixtures";
import { mockDiscordClient } from "./mock/discord";
import { TestTxManager } from "./mock/transaction";

let container: StartedPostgreSqlContainer;

export const setupTxManager = async () => {
  vi.mock("@discordeno/rest", () => ({
    createRestManager: vi.fn().mockImplementation(() => mockDiscordClient.rest),
  }));

  vi.mock("@discordeno/utils", () => ({
    getBotIdFromToken: vi.fn().mockImplementation(() => "mock_bot_id"),
  }));

  container = await new PostgreSqlContainer()
    .withDatabase("test")
    .withUsername("test")
    .withPassword("test")
    .start();

  const dbConfig = {
    connectionString: container.getConnectionUri(),
    isQueryLoggingEnabled: false,
  };

  const client = new Client({
    connectionString: dbConfig.connectionString,
  });
  await client.connect();

  const db = drizzle(client);
  await migrate(db, {
    migrationsFolder: path.join(
      __dirname,
      "../infra/repository/schema/migrations",
    ),
  });

  // Fetch existing channels from the database
  console.log("Fetching existing channels...");
  const channels = await db.select().from(channelTable).execute();

  console.log(`Found ${channels.length} channels. Creating videos...`);

  // Get list of VSPO member creator IDs
  console.log("Fetching creator IDs for VSPO members...");
  const vspoCreators = await db
    .select()
    .from(creatorTable)
    .where(inArray(creatorTable.id, Object.keys(VSPO_MEMBER_NAMES)))
    .execute();

  console.log(
    `Found ${vspoCreators.length} VSPO creators. Creating translations...`,
  );
  const creatorTranslations = createCreatorTranslations(
    vspoCreators.map((c) => c.id),
  );

  console.log(
    `Created ${creatorTranslations.length} creator translations. Inserting into database...`,
  );
  await batchInsert(db, creatorTranslationTable, creatorTranslations);

  let allVideos: InsertVideo[] = [];

  // Create videos for each channel
  for (const channel of channels) {
    const isVspoMember = VSPO_MEMBER_CHANNEL_IDS.includes(
      channel.platformChannelId,
    );
    const videos = createVideosForChannel(channel, isVspoMember);
    allVideos = [...allVideos, ...videos];
  }

  console.log(
    `Created ${allVideos.length} videos. Generating stream statuses...`,
  );
  const streamStatuses = createStreamStatuses(allVideos);

  console.log(
    `Generated ${streamStatuses.length} stream statuses. Creating translations...`,
  );
  const videoTranslations = createVideoTranslations(allVideos);

  console.log(
    `Created ${videoTranslations.length} video translations. Inserting into database...`,
  );

  // Insert data in the correct order with batching
  console.log("Inserting videos...");
  await batchInsert(db, videoTable, allVideos);

  console.log("Inserting stream statuses...");
  await batchInsert(db, streamStatusTable, streamStatuses);

  console.log("Inserting video translations...");
  await batchInsert(db, videoTranslationTable, videoTranslations);

  // Create and insert Discord server test data
  console.log("Generating Discord servers and channels...");
  const discordServers = createDiscordServers();
  const discordChannels = createDiscordChannels(discordServers);

  console.log(
    `Created ${discordServers.length} Discord servers. Inserting into database...`,
  );
  await batchInsert(db, discordServerTable, discordServers);

  console.log(
    `Created ${discordChannels.length} Discord channels. Inserting into database...`,
  );
  await batchInsert(db, discordChannelTable, discordChannels);

  console.log("Seed completed successfully!");

  const env = zAppWorkerEnv.parse(process.env);

  // Mock services
  const youtubeService = {
    youtube: null,
    chunkArray: () => [],
    getChannels: async () => Ok([]),
    getStreams: async () => Ok([]),
    searchStreams: async () => Ok([]),
    getStreamsByChannel: async () => Ok([]),
    searchClips: async () => Ok([]),
    getClips: async () => Ok([]),
  };

  const twitchService = {
    baseUrl: "",
    accessToken: "",
    config: { clientId: "", clientSecret: "" },
    getAccessToken: async () => "",
    fetchFromTwitch: async () => ({}),
    getChannels: async () => Ok([]),
    getStreams: async () => Ok([]),
    getStreamsByIDs: async () => Ok([]),
    getArchive: async () => Ok([]),
    getClipsByUserID: async () => Ok([]),
  };

  const twitcastingService = {
    accessToken: "",
    fetchUserVideos: async () => ({}),
    mapToTwitCastingVideo: async () => ({}),
    createVideoModel: async () => ({}),
    getChannels: async () => Ok([]),
    getStreams: async () => Ok([]),
    searchStreams: async () => Ok([]),
    getStreamsByIDs: async () => Ok([]),
    getArchive: async () => Ok([]),
  };

  const bilibiliService = {
    getStreams: async () => Ok([]),
  };

  afterEach(async () => {
    await container.stop();
  });

  return createAppContext(
    new TestTxManager(dbConfig),
    youtubeService,
    twitchService,
    twitcastingService,
    bilibiliService,
    createAIService({
      apiKey: env.OPENAI_API_KEY,
      organization: env.OPENAI_ORGANIZATION,
      project: env.OPENAI_PROJECT,
      baseURL: env.OPENAI_BASE_URL,
    }),
    createDiscordClient(env),
    createCloudflareKVCacheClient(env.APP_KV),
    createMastraService({
      baseUrl: env.MASTRA_BASE_URL,
      agentId: env.MASTRA_AGENT_ID,
      cfAccessClientId: env.MASTRA_CF_ACCESS_CLIENT_ID,
      cfAccessClientSecret: env.MASTRA_CF_ACCESS_CLIENT_SECRET,
    }),
  );
};

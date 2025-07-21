import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type {
  InsertCreatorTranslation,
  InsertDiscordChannel,
  InsertDiscordServer,
  InsertStreamStatus,
  InsertVideo,
  InsertVideoTranslation,
} from "../../infra/repository/schema";
import { createUUID } from "../../pkg/uuid";
// Helper function to generate dates
export const createDate = (daysOffset: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

// Random selection helpers
export const getRandomElement = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Specific channel IDs from the migration file
export const JP_YOUTUBE_CHANNELS = [
  "UCPkKpOHxEDcwmUAnRpIu-Ng", // 藍沢エマ
  "UCF_U2GCKHvDz52jWdizppIA", // 空澄セナ
  "UC5LyYg6cCA4yHEYvtUsir3g", // 一ノ瀬うるは
];

export const JP_TWITCH_CHANNELS = [
  "848822715", // 藍沢エマ
  "776751504", // 空澄セナ
  "582689327", // 一ノ瀬うるは
];

export const EN_YOUTUBE_CHANNELS = [
  "UCeCWj-SiJG9SWN6wGORiLmw", // Jira Jisaki
  "UCLlJpxXt6L5d-XQ0cDdIyDQ", // Arya Kuroha
  "UCCra1t-eIlO3ULyXQQMD9Xw", // Remia Aotsuki
];

export const EN_TWITCH_CHANNELS = [
  "1102212264", // Jira Jisaki
  "1102211983", // Arya Kuroha
  "1102206195", // Remia Aotsuki
];

// VSPO member name mapping
export const VSPO_MEMBER_NAMES: Record<string, Record<string, string>> = {
  // JP Members
  "4f2b3fdb-8056-4e7a-acd0-44a674056aa0": {
    // 藍沢エマ
    en: "Aizawa Ema",
    ja: "藍沢エマ",
    fr: "Aizawa Ema (FR)",
    de: "Aizawa Ema (DE)",
    es: "Aizawa Ema (ES)",
    cn: "蓝泽艾玛",
    tw: "藍澤艾瑪",
    ko: "아이자와 에마",
  },
  "76ccfc57-a6eb-4ebd-9b61-ad48c5f7a7eb": {
    // 空澄セナ
    en: "Asumi Sena",
    ja: "空澄セナ",
    fr: "Asumi Sena (FR)",
    de: "Asumi Sena (DE)",
    es: "Asumi Sena (ES)",
    cn: "空澄濑奈",
    tw: "空澄瀨奈",
    ko: "아스미 세나",
  },
  "627fbecd-30b6-4361-ac37-896ab33ac10f": {
    // 一ノ瀬うるは
    en: "Ichinose Uruha",
    ja: "一ノ瀬うるは",
    fr: "Ichinose Uruha (FR)",
    de: "Ichinose Uruha (DE)",
    es: "Ichinose Uruha (ES)",
    cn: "一之濑润叶",
    tw: "一之瀨潤葉",
    ko: "이치노세 우루하",
  },
  // EN Members
  "f7f20a06-0766-4456-be2d-c77e601f7835": {
    // Jira Jisaki
    en: "Jira Jisaki",
    ja: "地崎 ジーラ",
    fr: "Jira Jisaki (FR)",
    de: "Jira Jisaki (DE)",
    es: "Jira Jisaki (ES)",
    cn: "地崎 吉拉",
    tw: "地崎 吉拉",
    ko: "지사키 지라",
  },
  "8d8c4a35-3f24-4015-a06c-2224031ef225": {
    // Arya Kuroha
    en: "Arya Kuroha",
    ja: "黒羽 アリア",
    fr: "Arya Kuroha (FR)",
    de: "Arya Kuroha (DE)",
    es: "Arya Kuroha (ES)",
    cn: "黑羽 艾莉亚",
    tw: "黑羽 艾莉亞",
    ko: "쿠로하 아리아",
  },
  "e32cd370-c326-4ecf-b03b-611c96dea0d0": {
    // Remia Aotsuki
    en: "Remia Aotsuki",
    ja: "蒼月 レミア",
    fr: "Remia Aotsuki (FR)",
    de: "Remia Aotsuki (DE)",
    es: "Remia Aotsuki (ES)",
    cn: "苍月 蕾米亚",
    tw: "蒼月 蕾米亞",
    ko: "아오츠키 레미아",
  },
};

// All VSPO member channel IDs combined
export const VSPO_MEMBER_CHANNEL_IDS = [
  ...JP_YOUTUBE_CHANNELS,
  ...JP_TWITCH_CHANNELS,
  ...EN_YOUTUBE_CHANNELS,
  ...EN_TWITCH_CHANNELS,
];

// ============ CREATOR TRANSLATIONS ============
type CreatorTranslationData = InsertCreatorTranslation;

export const createCreatorTranslations = (
  creatorIds: string[],
): CreatorTranslationData[] => {
  console.log("Generating creator translations...");

  const _languages = ["en", "ja", "fr", "de", "es", "cn", "tw", "ko"];
  const result: CreatorTranslationData[] = [];

  for (const creatorId of creatorIds) {
    // Check if this creator has predefined translations
    const translations = VSPO_MEMBER_NAMES[creatorId];

    if (translations) {
      // Create translations for each language we have defined
      for (const [lang, name] of Object.entries(translations)) {
        result.push({
          id: createUUID(),
          creatorId: creatorId,
          languageCode: lang,
          name: name,
          updatedAt: getCurrentUTCDate(),
        } satisfies CreatorTranslationData);
      }
    }
  }

  return result;
};

// ============ VIDEOS ============
type VideoData = InsertVideo;

// Define a type for channel to replace 'any'
interface ChannelInfo {
  platformType: string;
  platformChannelId: string;
}

export const createVideosForChannel = (
  channel: ChannelInfo,
  isVspoMember: boolean,
): VideoData[] => {
  const result: VideoData[] = [];
  // Create 2-5 videos per channel
  const videoCount = 30;

  for (let i = 0; i < videoCount; i++) {
    // Vspo members get vspo_stream, others get clip
    const videoType = isVspoMember ? "vspo_stream" : "clip";
    const videoId = createUUID();
    const rawId = `video_${videoType}_${channel.platformType}_${videoId.substring(0, 8)}`;

    result.push({
      id: videoId,
      rawId,
      channelId: channel.platformChannelId,
      platformType: channel.platformType,
      videoType,
      publishedAt: createDate(-getRandomInt(1, 60)), // Published in the last 60 days
      tags: Array.from({ length: getRandomInt(2, 5) }, () =>
        getRandomElement([
          "gaming",
          "vspo",
          "vtuber",
          "rpg",
          "fps",
          "action",
          "moba",
          "collab",
          "challenge",
        ]),
      ).join(","),
      thumbnailUrl: `https://example.com/videos/${videoType}_${createUUID().substring(0, 8)}.jpg`,
      link: `https://example.com/watch?v=${rawId}`,
      deleted: Math.random() < 0.05, // 5% chance of being deleted
    } satisfies VideoData);
  }

  return result;
};

// ============ STREAM STATUS ============
type StreamStatusData = InsertStreamStatus;

export const createStreamStatuses = (
  videos: VideoData[],
): StreamStatusData[] => {
  console.log("Generating stream statuses...");

  const statuses = ["live", "upcoming", "ended", "unknown"];
  const result: StreamStatusData[] = [];

  for (const video of videos) {
    const status = getRandomElement(statuses);
    let startedAt: Date | null = null;
    let endedAt: Date | null = null;

    // Set realistic start/end times based on status
    switch (status) {
      case "live":
        startedAt = createDate(-getRandomInt(0, 1)); // Started today or yesterday
        endedAt = null; // Still ongoing
        break;
      case "upcoming":
        startedAt = createDate(getRandomInt(1, 14)); // Will start in next 2 weeks
        endedAt = null;
        break;
      case "ended": {
        startedAt = createDate(-getRandomInt(7, 30)); // Started in last month
        // Stream lasted between 1-6 hours
        const streamDuration = getRandomInt(1, 6);
        const startDate = new Date(startedAt);
        endedAt = new Date(
          startDate.setHours(startDate.getHours() + streamDuration),
        );
        break;
      }
      case "unknown":
        // Maybe we have partial data
        if (Math.random() > 0.5) {
          startedAt = createDate(-getRandomInt(1, 5));
        }
        break;
    }

    result.push({
      id: createUUID(),
      videoId: video.rawId,
      status,
      startedAt,
      endedAt,
      viewCount: getRandomInt(100, 500000),
      updatedAt: getCurrentUTCDate(),
    } satisfies StreamStatusData);
  }

  return result;
};

// ============ VIDEO TRANSLATIONS ============
type VideoTranslationData = InsertVideoTranslation;

export const createVideoTranslations = (
  videos: VideoData[],
): VideoTranslationData[] => {
  console.log("Generating video translations...");

  const languages = ["default", "en", "ja", "fr", "de", "es", "cn", "tw", "ko"];
  const result: VideoTranslationData[] = [];

  for (const video of videos) {
    // Always add default translation
    result.push({
      id: createUUID(),
      videoId: video.rawId,
      languageCode: "default",
      title: `Default Title: ${video.videoType} video (${video.rawId.slice(-8)})`,
      description: `This is the default description for a ${video.videoType} video on platform ${video.platformType}.`,
      updatedAt: getCurrentUTCDate(),
    } satisfies VideoTranslationData);

    // Add 2-4 random translations
    const additionalLanguages = languages
      .filter((lang) => lang !== "default")
      .sort(() => 0.5 - Math.random())
      .slice(0, getRandomInt(2, 4));

    for (const lang of additionalLanguages) {
      result.push({
        id: createUUID(),
        videoId: video.rawId,
        languageCode: lang,
        title: `${lang.toUpperCase()} Title: ${video.videoType} video (${video.rawId.slice(-8)})`,
        description: `This is the ${lang} description for a ${video.videoType} video on platform ${video.platformType}.`,
        updatedAt: getCurrentUTCDate(),
      } satisfies VideoTranslationData);
    }
  }

  return result;
};

// Define types for database operations
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgTable, TableConfig } from "drizzle-orm/pg-core";

// Helper function to batch insert data
export const batchInsert = async <T>(
  db: NodePgDatabase<Record<string, unknown>>,
  table: PgTable<TableConfig>,
  data: T[],
  batchSize = 100,
) => {
  console.log(
    `Batch inserting ${data.length} records with batch size ${batchSize}...`,
  );
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    console.log(
      `Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)}...`,
    );
    await db.insert(table).values(batch).execute();
  }
  console.log(`Completed inserting all ${data.length} records.`);
};

// ============ DISCORD SERVERS ============
type DiscordServerData = InsertDiscordServer;

export const DISCORD_SERVER_NAMES: Record<string, Record<string, string>> = {
  server1: {
    en: "VSPO Fan Server",
    ja: "ぶいすぽっ！ファンサーバー",
    fr: "Serveur des fans de VSPO",
    de: "VSPO Fan-Server",
    es: "Servidor de fans de VSPO",
    cn: "VSPO粉丝服务器",
    tw: "VSPO粉絲伺服器",
    ko: "부이스포! 팬 서버",
  },
  server2: {
    en: "Emma's Community",
    ja: "エマのコミュニティ",
    fr: "Communauté d'Emma",
    de: "Emmas Gemeinschaft",
    es: "Comunidad de Emma",
    cn: "艾玛的社区",
    tw: "艾瑪的社群",
    ko: "에마의 커뮤니티",
  },
  server3: {
    en: "VTuber News",
    ja: "VTuberニュース",
    fr: "Actualités VTuber",
    de: "VTuber Nachrichten",
    es: "Noticias de VTuber",
    cn: "虚拟主播新闻",
    tw: "虛擬主播新聞",
    ko: "브이튜버 뉴스",
  },
};

export const createDiscordServers = (count = 3): DiscordServerData[] => {
  console.log("Generating Discord servers...");

  const languages = ["en", "ja", "fr", "de", "es", "cn", "tw", "ko"];
  const result: DiscordServerData[] = [];

  const serverIds = Object.keys(DISCORD_SERVER_NAMES);

  for (let i = 0; i < count; i++) {
    const serverId = serverIds[i] || `server${i + 1}`;
    const discordId = `guild_${createUUID().substring(0, 8)}`;

    // Get language for this server
    const lang = getRandomElement(languages);

    // Get name based on language if available
    let name = `Discord Server ${i + 1}`;
    if (DISCORD_SERVER_NAMES[serverId]) {
      name = DISCORD_SERVER_NAMES[serverId][lang] || name;
    }

    result.push({
      id: createUUID(),
      serverId: discordId,
      name: name,
      languageCode: lang,
      createdAt: createDate(-getRandomInt(1, 365)), // Created within the last year
      updatedAt: getCurrentUTCDate(),
    } satisfies DiscordServerData);
  }

  return result;
};

// ============ DISCORD CHANNELS ============
type DiscordChannelData = InsertDiscordChannel;

export const CHANNEL_TYPES = [
  "vspo_all",
  "vspo_jp",
  "vspo_en",
  "vspo_ch",
  "general",
];

export const createDiscordChannels = (
  servers: DiscordServerData[],
): DiscordChannelData[] => {
  console.log("Generating Discord channels...");

  const _languages = ["en", "ja", "fr", "de", "es", "cn", "tw", "ko"];
  const result: DiscordChannelData[] = [];

  for (const server of servers) {
    // Create 2-5 channels per server
    const channelCount = getRandomInt(2, 5);

    for (let i = 0; i < channelCount; i++) {
      const channelType = getRandomElement(CHANNEL_TYPES);

      // Get name based on channel type and server language
      let channelName = "";
      switch (channelType) {
        case "vspo_all":
          channelName =
            server.languageCode === "ja"
              ? "ぶいすぽっ！-全メンバー"
              : "vspo-all-members";
          break;
        case "vspo_jp":
          channelName =
            server.languageCode === "ja" ? "ぶいすぽっ！-日本" : "vspo-jp";
          break;
        case "vspo_en":
          channelName =
            server.languageCode === "ja" ? "ぶいすぽっ！-英語" : "vspo-en";
          break;
        case "vspo_ch":
          channelName =
            server.languageCode === "ja" ? "ぶいすぽっ！-中国語" : "vspo-ch";
          break;
        case "general":
          channelName = server.languageCode === "ja" ? "雑談" : "general-chat";
          break;
      }

      result.push({
        id: createUUID(),
        channelId: `channel_${createUUID().substring(0, 8)}`,
        serverId: server.serverId,
        name: channelName,
        languageCode: server.languageCode,
        memberType: channelType,
        createdAt: server.createdAt,
        updatedAt: getCurrentUTCDate(),
      } satisfies DiscordChannelData);
    }
  }

  return result;
};

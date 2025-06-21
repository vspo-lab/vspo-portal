import { z } from "zod";
import {
  type LiveWatchParty,
  LiveWatchPartySchema,
} from "../../common/types/schemas";
import {
  type ApiResponse,
  BaseService,
  type BaseSort,
  NotFoundError,
  type PaginatedResponse,
  type PaginationParams,
  ValidationError,
  validateId,
  validateNumber,
  validatePagination,
} from "./base";

// Watch Party specific schemas
export const WatchPartyFiltersSchema = z.object({
  status: z.enum(["LIVE", "SCHEDULED", "ENDED"]).optional(),
  vtuber: z.string().optional(),
  hostUser: z.string().optional(),
  minViewers: z.number().optional(),
  maxViewers: z.number().optional(),
  isPopular: z.boolean().optional(),
  language: z.enum(["ja", "en", "ko", "cn", "tw", "all"]).optional(),
  category: z
    .enum([
      "all",
      "gaming",
      "music",
      "collab",
      "chatting",
      "asmr",
      "art",
      "cooking",
      "special",
    ])
    .optional(),
  searchQuery: z.string().optional(),
  tags: z.array(z.string()).optional(),
  startTimeRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
});

export const WatchPartySortSchema = z.object({
  field: z
    .enum([
      "title",
      "vtuber",
      "viewers",
      "startTime",
      "hostUser",
      "createdAt",
      "popularity",
    ])
    .default("startTime"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export const WatchPartyDetailSchema = LiveWatchPartySchema.extend({
  description: z.string().optional(),
  category: z.string(),
  language: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  duration: z.string().optional(), // For ended parties
  maxViewers: z.number(),
  averageViewers: z.number().optional(),
  chatMessages: z.number().optional(),
  playlist: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        thumbnail: z.string(),
        duration: z.string(),
        order: z.number(),
      }),
    )
    .optional(),
  participants: z
    .array(
      z.object({
        id: z.string(),
        username: z.string(),
        avatar: z.string(),
        joinedAt: z.string(),
        isHost: z.boolean(),
        isModerator: z.boolean(),
      }),
    )
    .optional(),
  chatHistory: z
    .array(
      z.object({
        id: z.string(),
        userId: z.string(),
        username: z.string(),
        message: z.string(),
        timestamp: z.string(),
        type: z
          .enum(["message", "system", "emoji", "sticker"])
          .default("message"),
      }),
    )
    .optional(),
});

export const CreateWatchPartySchema = z.object({
  title: z.string().min(1).max(100),
  vtuber: z.string().min(1),
  thumbnail: z.string().url(),
  scheduledTime: z.string(), // ISO date string
  description: z.string().optional(),
  category: z.string().default("chatting"),
  language: z.string().default("ja"),
  tags: z.array(z.string()).default([]),
  isPrivate: z.boolean().default(false),
  maxParticipants: z.number().min(2).max(1000).default(100),
});

export const JoinWatchPartySchema = z.object({
  roomCode: z.string(),
  username: z.string().min(1).max(50),
});

// Inferred types
export type WatchPartyFilters = z.infer<typeof WatchPartyFiltersSchema>;
export type WatchPartySort = z.infer<typeof WatchPartySortSchema>;
export type WatchPartyDetail = z.infer<typeof WatchPartyDetailSchema>;
export type CreateWatchPartyRequest = z.infer<typeof CreateWatchPartySchema>;
export type JoinWatchPartyRequest = z.infer<typeof JoinWatchPartySchema>;

// Mock data
const mockWatchParties: (LiveWatchParty & {
  category: string;
  language: string;
  tags: string[];
  createdAt: string;
  description?: string;
  maxViewers: number;
})[] = [
  {
    id: 1,
    title: "【APEX】ランク上げ配信を一緒に見よう！",
    vtuber: "橘ひなの",
    thumbnail: "/placeholder.svg?height=180&width=320",
    viewers: 147,
    status: "LIVE",
    startTime: "2024-01-16T19:00:00Z",
    hostUser: "FPSファン123",
    hostBadge: "🎮",
    roomCode: "APEX2024",
    isPopular: true,
    category: "gaming",
    language: "ja",
    tags: ["APEX", "ランクマッチ", "FPS"],
    createdAt: "2024-01-16T18:45:00Z",
    description: "ひなのちゃんのランクマッチを皆で応援しながら見ましょう！",
    maxViewers: 200,
  },
  {
    id: 2,
    title: "【歌枠】みんなで歌詞を覚えよう",
    vtuber: "藍沢エマ",
    thumbnail: "/placeholder.svg?height=180&width=320",
    viewers: 89,
    status: "LIVE",
    startTime: "2024-01-16T20:30:00Z",
    hostUser: "歌好きリスナー",
    hostBadge: "🎵",
    roomCode: "SONG789",
    isPopular: false,
    category: "music",
    language: "ja",
    tags: ["歌枠", "歌ってみた", "ボカロ"],
    createdAt: "2024-01-16T20:15:00Z",
    description: "エマちゃんの歌枠を聴きながら歌詞を一緒に覚えませんか？",
    maxViewers: 150,
  },
  {
    id: 3,
    title: "【コラボ】VSPO!大型コラボ配信",
    vtuber: "VSPO!",
    thumbnail: "/placeholder.svg?height=180&width=320",
    viewers: 234,
    status: "LIVE",
    startTime: "2024-01-16T21:00:00Z",
    hostUser: "VSPOファン",
    hostBadge: "🤝",
    roomCode: "VSPO123",
    isPopular: true,
    category: "collab",
    language: "ja",
    tags: ["コラボ", "大型企画", "マイクラ"],
    createdAt: "2024-01-16T20:30:00Z",
    description: "VSPO!メンバー全員参加の大型コラボ企画を一緒に楽しもう！",
    maxViewers: 500,
  },
  {
    id: 4,
    title: "【雑談】深夜の癒やしタイム",
    vtuber: "一ノ瀬うるは",
    thumbnail: "/placeholder.svg?height=180&width=320",
    viewers: 56,
    status: "LIVE",
    startTime: "2024-01-16T23:00:00Z",
    hostUser: "夜更かし組",
    hostBadge: "🌙",
    roomCode: "NIGHT56",
    isPopular: false,
    category: "chatting",
    language: "ja",
    tags: ["雑談", "深夜", "癒やし"],
    createdAt: "2024-01-16T22:45:00Z",
    description: "うるはちゃんの優しい声で深夜の癒やし時間を過ごしましょう",
    maxViewers: 100,
  },
  {
    id: 5,
    title: "【EN】Zentreya Gaming Session",
    vtuber: "Zentreya",
    thumbnail: "/placeholder.svg?height=180&width=320",
    viewers: 78,
    status: "SCHEDULED",
    startTime: "2024-01-17T02:00:00Z",
    hostUser: "ENFan42",
    hostBadge: "🎮",
    roomCode: "ZEN2024",
    isPopular: true,
    category: "gaming",
    language: "en",
    tags: ["Variety Gaming", "EN", "Twitch"],
    createdAt: "2024-01-16T12:00:00Z",
    description: "Join us for Zentreya's gaming session with live chat!",
    maxViewers: 200,
  },
  {
    id: 6,
    title: "【お絵描き】イラスト制作過程を見よう",
    vtuber: "胡桃のあ",
    thumbnail: "/placeholder.svg?height=180&width=320",
    viewers: 43,
    status: "SCHEDULED",
    startTime: "2024-01-17T15:00:00Z",
    hostUser: "アート愛好家",
    hostBadge: "🎨",
    roomCode: "ART123",
    isPopular: false,
    category: "art",
    language: "ja",
    tags: ["お絵描き", "イラスト", "制作過程"],
    createdAt: "2024-01-16T14:30:00Z",
    description:
      "のあちゃんのお絵描き配信を見ながらアートについて語り合いましょう",
    maxViewers: 80,
  },
  {
    id: 7,
    title: "【ASMR】みんなでリラックスタイム",
    vtuber: "一ノ瀬うるは",
    thumbnail: "/placeholder.svg?height=180&width=320",
    viewers: 92,
    status: "SCHEDULED",
    startTime: "2024-01-17T22:00:00Z",
    hostUser: "癒やし求道者",
    hostBadge: "🎧",
    roomCode: "RELAX7",
    isPopular: true,
    category: "asmr",
    language: "ja",
    tags: ["ASMR", "癒やし", "リラックス"],
    createdAt: "2024-01-16T16:00:00Z",
    description: "うるはちゃんのASMR配信でみんな一緒にリラックスしませんか？",
    maxViewers: 150,
  },
  {
    id: 8,
    title: "【料理】みんなでレシピを学ぼう",
    vtuber: "胡桃のあ",
    thumbnail: "/placeholder.svg?height=180&width=320",
    viewers: 0,
    status: "SCHEDULED",
    startTime: "2024-01-18T18:00:00Z",
    hostUser: "料理好き",
    hostBadge: "🍳",
    roomCode: "COOK18",
    isPopular: false,
    category: "cooking",
    language: "ja",
    tags: ["料理", "レシピ", "学習"],
    createdAt: "2024-01-16T10:00:00Z",
    description: "のあちゃんの料理配信を見ながら一緒にレシピを覚えよう！",
    maxViewers: 100,
  },
];

// Mock detailed data for watch parties
const mockWatchPartyDetails: Record<number, Partial<WatchPartyDetail>> = {
  1: {
    averageViewers: 125,
    chatMessages: 1543,
    playlist: [
      {
        id: "clip_1",
        title: "【APEX】神業クラッチ集",
        thumbnail: "/placeholder.svg?height=90&width=160",
        duration: "5:30",
        order: 1,
      },
      {
        id: "clip_2",
        title: "【APEX】面白リアクション集",
        thumbnail: "/placeholder.svg?height=90&width=160",
        duration: "8:15",
        order: 2,
      },
    ],
    participants: [
      {
        id: "host_1",
        username: "FPSファン123",
        avatar: "/placeholder.svg?height=32&width=32",
        joinedAt: "2024-01-16T18:45:00Z",
        isHost: true,
        isModerator: true,
      },
      {
        id: "user_2",
        username: "APEXプレデター",
        avatar: "/placeholder.svg?height=32&width=32",
        joinedAt: "2024-01-16T19:05:00Z",
        isHost: false,
        isModerator: false,
      },
    ],
    chatHistory: [
      {
        id: "msg_1",
        userId: "host_1",
        username: "FPSファン123",
        message:
          "皆さん、こんばんは！今日もひなのちゃんの配信を一緒に楽しみましょう！",
        timestamp: "2024-01-16T19:00:30Z",
        type: "message",
      },
      {
        id: "msg_2",
        userId: "user_2",
        username: "APEXプレデター",
        message: "今日のランクマッチ、調子良さそうですね！",
        timestamp: "2024-01-16T19:05:15Z",
        type: "message",
      },
    ],
  },
};

class WatchPartyService extends BaseService {
  /**
   * Get all watch parties with filtering, sorting, and pagination
   */
  static async getWatchParties(
    filters?: WatchPartyFilters,
    sort?: WatchPartySort,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<LiveWatchParty>> {
    await WatchPartyService.simulateNetworkDelay(200, 600);

    try {
      const validatedPagination = validatePagination(pagination || {});
      const validatedFilters = WatchPartyFiltersSchema.parse(filters || {});
      const validatedSort = WatchPartySortSchema.parse(sort || {});

      // Check cache
      const cacheKey = `watch_parties_${JSON.stringify({ filters: validatedFilters, sort: validatedSort, pagination: validatedPagination })}`;
      const cached =
        WatchPartyService.getCache<PaginatedResponse<LiveWatchParty>>(cacheKey);
      if (cached) {
        return { ...cached, meta: { ...cached.meta, cached: true } };
      }

      let filteredData = [...mockWatchParties];

      // Apply filters
      if (validatedFilters.status) {
        filteredData = filteredData.filter(
          (party) => party.status === validatedFilters.status,
        );
      }

      if (validatedFilters.vtuber) {
        filteredData = filteredData.filter((party) =>
          party.vtuber
            .toLowerCase()
            .includes(validatedFilters.vtuber?.toLowerCase()),
        );
      }

      if (validatedFilters.hostUser) {
        filteredData = filteredData.filter((party) =>
          party.hostUser
            .toLowerCase()
            .includes(validatedFilters.hostUser?.toLowerCase()),
        );
      }

      if (validatedFilters.minViewers !== undefined) {
        filteredData = filteredData.filter(
          (party) => party.viewers >= validatedFilters.minViewers!,
        );
      }

      if (validatedFilters.maxViewers !== undefined) {
        filteredData = filteredData.filter(
          (party) => party.viewers <= validatedFilters.maxViewers!,
        );
      }

      if (validatedFilters.isPopular !== undefined) {
        filteredData = filteredData.filter(
          (party) => party.isPopular === validatedFilters.isPopular,
        );
      }

      if (validatedFilters.language && validatedFilters.language !== "all") {
        filteredData = filteredData.filter(
          (party) => party.language === validatedFilters.language,
        );
      }

      if (validatedFilters.category && validatedFilters.category !== "all") {
        filteredData = filteredData.filter(
          (party) => party.category === validatedFilters.category,
        );
      }

      if (validatedFilters.searchQuery) {
        filteredData = WatchPartyService.filterBySearch(
          filteredData,
          validatedFilters.searchQuery,
          ["title", "vtuber", "hostUser", "tags", "description"],
        );
      }

      if (validatedFilters.tags && validatedFilters.tags.length > 0) {
        filteredData = filteredData.filter((party) =>
          validatedFilters.tags?.some((tag) => party.tags.includes(tag)),
        );
      }

      // Apply start time range filter
      if (
        validatedFilters.startTimeRange?.from ||
        validatedFilters.startTimeRange?.to
      ) {
        filteredData = filteredData.filter((party) => {
          const partyTime = new Date(party.startTime);
          const fromTime = validatedFilters.startTimeRange?.from
            ? new Date(validatedFilters.startTimeRange.from)
            : null;
          const toTime = validatedFilters.startTimeRange?.to
            ? new Date(validatedFilters.startTimeRange.to)
            : null;

          if (fromTime && partyTime < fromTime) return false;
          if (toTime && partyTime > toTime) return false;
          return true;
        });
      }

      // Apply sorting
      if (validatedSort.field === "popularity") {
        filteredData.sort((a, b) => {
          const aScore = (a.isPopular ? 1000 : 0) + a.viewers;
          const bScore = (b.isPopular ? 1000 : 0) + b.viewers;
          return validatedSort.direction === "desc"
            ? bScore - aScore
            : aScore - bScore;
        });
      } else {
        filteredData = WatchPartyService.sortArray(filteredData, {
          field: validatedSort.field,
          direction: validatedSort.direction,
        });
      }

      // Apply pagination
      const { items, total } = WatchPartyService.paginateArray(
        filteredData,
        validatedPagination,
      );
      const paginationMeta = WatchPartyService.calculatePagination(
        total,
        validatedPagination.page,
        validatedPagination.limit,
      );

      // Convert to base LiveWatchParty type (remove extended fields)
      const watchPartiesResponse = items.map((item) => ({
        id: item.id,
        title: item.title,
        vtuber: item.vtuber,
        thumbnail: item.thumbnail,
        viewers: item.viewers,
        status: item.status,
        startTime: item.startTime,
        hostUser: item.hostUser,
        hostBadge: item.hostBadge,
        roomCode: item.roomCode,
        isPopular: item.isPopular,
      }));

      const response = WatchPartyService.createPaginatedResponse(
        watchPartiesResponse,
        paginationMeta,
      );
      WatchPartyService.setCache(cacheKey, response, 2); // Cache for 2 minutes (real-time data)

      return response;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to fetch watch parties: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get a single watch party by ID with detailed information
   */
  static async getWatchPartyById(
    id: number,
  ): Promise<ApiResponse<WatchPartyDetail>> {
    await WatchPartyService.simulateNetworkDelay(150, 400);

    try {
      const validatedId = validateNumber(id, "Watch Party ID");

      const cacheKey = `watch_party_detail_${validatedId}`;
      const cached = WatchPartyService.getCache<WatchPartyDetail>(cacheKey);
      if (cached) {
        return WatchPartyService.createResponse(cached, true);
      }

      const watchParty = mockWatchParties.find((p) => p.id === validatedId);
      if (!watchParty) {
        throw new NotFoundError("Watch Party", validatedId.toString());
      }

      const detailData = mockWatchPartyDetails[validatedId] || {};

      const watchPartyDetail: WatchPartyDetail = {
        ...watchParty,
        description: watchParty.description,
        averageViewers: detailData.averageViewers || watchParty.viewers,
        chatMessages: detailData.chatMessages || 0,
        playlist: detailData.playlist || [],
        participants: detailData.participants || [],
        chatHistory: detailData.chatHistory || [],
        duration: watchParty.status === "ENDED" ? "2:30:45" : undefined,
      };

      WatchPartyService.setCache(cacheKey, watchPartyDetail, 5); // Cache for 5 minutes
      return WatchPartyService.createResponse(watchPartyDetail);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to fetch watch party: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get live watch parties (currently happening)
   */
  static async getLiveWatchParties(
    limit = 20,
  ): Promise<ApiResponse<LiveWatchParty[]>> {
    return WatchPartyService.getWatchParties(
      { status: "LIVE" },
      { field: "viewers", direction: "desc" },
      { page: 1, limit },
    );
  }

  /**
   * Get scheduled watch parties
   */
  static async getScheduledWatchParties(
    limit = 20,
  ): Promise<ApiResponse<LiveWatchParty[]>> {
    const result = await WatchPartyService.getWatchParties(
      { status: "SCHEDULED" },
      { field: "startTime", direction: "asc" },
      { page: 1, limit },
    );
    return WatchPartyService.createResponse(result.data);
  }

  /**
   * Get popular watch parties
   */
  static async getPopularWatchParties(
    limit = 10,
  ): Promise<ApiResponse<LiveWatchParty[]>> {
    await WatchPartyService.simulateNetworkDelay(150, 400);

    try {
      const cacheKey = `popular_watch_parties_${limit}`;
      const cached = WatchPartyService.getCache<LiveWatchParty[]>(cacheKey);
      if (cached) {
        return WatchPartyService.createResponse(cached, true);
      }

      const popular = mockWatchParties
        .filter((party) => party.isPopular)
        .sort((a, b) => b.viewers - a.viewers)
        .slice(0, limit)
        .map((item) => ({
          id: item.id,
          title: item.title,
          vtuber: item.vtuber,
          thumbnail: item.thumbnail,
          viewers: item.viewers,
          status: item.status,
          startTime: item.startTime,
          hostUser: item.hostUser,
          hostBadge: item.hostBadge,
          roomCode: item.roomCode,
          isPopular: item.isPopular,
        }));

      WatchPartyService.setCache(cacheKey, popular, 5);
      return WatchPartyService.createResponse(popular);
    } catch (error) {
      throw new Error(
        `Failed to fetch popular watch parties: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Create a new watch party (mock operation)
   */
  static async createWatchParty(
    data: CreateWatchPartyRequest,
  ): Promise<ApiResponse<LiveWatchParty>> {
    await WatchPartyService.simulateNetworkDelay(500, 1000);

    try {
      const validatedData = CreateWatchPartySchema.parse(data);

      // Generate room code
      const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();

      const newWatchParty: LiveWatchParty = {
        id: mockWatchParties.length + 1,
        title: validatedData.title,
        vtuber: validatedData.vtuber,
        thumbnail: validatedData.thumbnail,
        viewers: 0,
        status: "SCHEDULED",
        startTime: validatedData.scheduledTime,
        hostUser: "CurrentUser", // Would come from auth context
        hostBadge: "🎉",
        roomCode,
        isPopular: false,
      };

      // Simulate adding to database
      mockWatchParties.push({
        ...newWatchParty,
        category: validatedData.category,
        language: validatedData.language,
        tags: validatedData.tags,
        createdAt: new Date().toISOString(),
        description: validatedData.description,
        maxViewers: validatedData.maxParticipants,
      });

      // Clear cache
      WatchPartyService.clearCache("watch_parties");

      return WatchPartyService.createResponse(newWatchParty);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to create watch party: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Join a watch party (mock operation)
   */
  static async joinWatchParty(
    data: JoinWatchPartyRequest,
  ): Promise<ApiResponse<{ success: boolean; watchParty: LiveWatchParty }>> {
    await WatchPartyService.simulateNetworkDelay(300, 700);

    try {
      const validatedData = JoinWatchPartySchema.parse(data);

      const watchParty = mockWatchParties.find(
        (p) => p.roomCode === validatedData.roomCode,
      );
      if (!watchParty) {
        throw new NotFoundError(
          "Watch Party with room code",
          validatedData.roomCode,
        );
      }

      if (watchParty.status === "ENDED") {
        throw new ValidationError("Cannot join an ended watch party");
      }

      // Simulate joining (increment viewer count)
      watchParty.viewers += 1;

      // Clear related cache
      WatchPartyService.clearCache(`watch_party_detail_${watchParty.id}`);
      WatchPartyService.clearCache("watch_parties");

      return WatchPartyService.createResponse({
        success: true,
        watchParty: {
          id: watchParty.id,
          title: watchParty.title,
          vtuber: watchParty.vtuber,
          thumbnail: watchParty.thumbnail,
          viewers: watchParty.viewers,
          status: watchParty.status,
          startTime: watchParty.startTime,
          hostUser: watchParty.hostUser,
          hostBadge: watchParty.hostBadge,
          roomCode: watchParty.roomCode,
          isPopular: watchParty.isPopular,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to join watch party: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Leave a watch party (mock operation)
   */
  static async leaveWatchParty(
    roomCode: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    await WatchPartyService.simulateNetworkDelay(200, 400);

    try {
      const validatedRoomCode = validateId(roomCode, "Room code");

      const watchParty = mockWatchParties.find(
        (p) => p.roomCode === validatedRoomCode,
      );
      if (!watchParty) {
        throw new NotFoundError(
          "Watch Party with room code",
          validatedRoomCode,
        );
      }

      // Simulate leaving (decrement viewer count)
      if (watchParty.viewers > 0) {
        watchParty.viewers -= 1;
      }

      // Clear related cache
      WatchPartyService.clearCache(`watch_party_detail_${watchParty.id}`);
      WatchPartyService.clearCache("watch_parties");

      return WatchPartyService.createResponse({ success: true });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to leave watch party: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get watch party analytics
   */
  static async getWatchPartyAnalytics(): Promise<
    ApiResponse<{
      totalParties: number;
      liveParties: number;
      scheduledParties: number;
      totalViewers: number;
      averageViewersPerParty: number;
      popularParties: number;
      topHosts: Array<{
        hostUser: string;
        partyCount: number;
        totalViewers: number;
      }>;
      categoryDistribution: Record<string, number>;
      viewersByHour: Array<{ hour: number; viewers: number }>;
    }>
  > {
    await WatchPartyService.simulateNetworkDelay(200, 500);

    try {
      const cacheKey = "watch_party_analytics";
      const cached = WatchPartyService.getCache(cacheKey);
      if (cached) {
        return WatchPartyService.createResponse(cached, true);
      }

      const totalParties = mockWatchParties.length;
      const liveParties = mockWatchParties.filter(
        (p) => p.status === "LIVE",
      ).length;
      const scheduledParties = mockWatchParties.filter(
        (p) => p.status === "SCHEDULED",
      ).length;
      const totalViewers = mockWatchParties.reduce(
        (sum, p) => sum + p.viewers,
        0,
      );
      const averageViewersPerParty = totalViewers / totalParties;
      const popularParties = mockWatchParties.filter((p) => p.isPopular).length;

      // Top hosts
      const hostStats = new Map<
        string,
        { partyCount: number; totalViewers: number }
      >();
      mockWatchParties.forEach((party) => {
        const existing = hostStats.get(party.hostUser) || {
          partyCount: 0,
          totalViewers: 0,
        };
        hostStats.set(party.hostUser, {
          partyCount: existing.partyCount + 1,
          totalViewers: existing.totalViewers + party.viewers,
        });
      });

      const topHosts = Array.from(hostStats.entries())
        .map(([hostUser, stats]) => ({ hostUser, ...stats }))
        .sort((a, b) => b.partyCount - a.partyCount)
        .slice(0, 5);

      // Category distribution
      const categoryDistribution: Record<string, number> = {};
      mockWatchParties.forEach((party) => {
        categoryDistribution[party.category] =
          (categoryDistribution[party.category] || 0) + 1;
      });

      // Mock hourly data
      const viewersByHour = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        viewers: Math.floor(Math.random() * 500) + 100,
      }));

      const analytics = {
        totalParties,
        liveParties,
        scheduledParties,
        totalViewers,
        averageViewersPerParty: Math.round(averageViewersPerParty * 10) / 10,
        popularParties,
        topHosts,
        categoryDistribution,
        viewersByHour,
      };

      WatchPartyService.setCache(cacheKey, analytics, 30); // Cache for 30 minutes
      return WatchPartyService.createResponse(analytics);
    } catch (error) {
      throw new Error(
        `Failed to fetch watch party analytics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get available categories for watch parties
   */
  static async getWatchPartyCategories(): Promise<ApiResponse<string[]>> {
    const categories = [
      "gaming",
      "music",
      "collab",
      "chatting",
      "asmr",
      "art",
      "cooking",
      "special",
    ];

    return WatchPartyService.createResponse(categories);
  }
}

export default WatchPartyService;

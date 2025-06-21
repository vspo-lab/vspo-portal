import { z } from "zod";
import { type Playlist, PlaylistSchema } from "../../common/types/schemas";
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

// Playlist-specific schemas
export const PlaylistFiltersSchema = z.object({
  creator: z.string().optional(),
  isHot: z.boolean().optional(),
  minVideoCount: z.number().optional(),
  maxVideoCount: z.number().optional(),
  minLikes: z.number().optional(),
  minWatchParties: z.number().optional(),
  category: z
    .enum([
      "all",
      "gaming",
      "music",
      "collab",
      "asmr",
      "art",
      "talk",
      "cooking",
      "special",
      "horror",
      "educational",
    ])
    .optional(),
  tags: z.array(z.string()).optional(),
  searchQuery: z.string().optional(),
  hasActiveWatchParty: z.boolean().optional(),
});

export const PlaylistSortSchema = z.object({
  field: z
    .enum([
      "title",
      "creator",
      "videoCount",
      "views",
      "likes",
      "watchPartyCount",
      "createdAt",
      "updatedAt",
      "trending",
    ])
    .default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export const PlaylistItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string(),
  duration: z.string(),
  addedAt: z.string(),
  order: z.number(),
  vtuber: z.string(),
  clipper: z.string().optional(),
});

export const PlaylistDetailSchema = PlaylistSchema.extend({
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(PlaylistItemSchema),
  isPrivate: z.boolean().default(false),
  collaborators: z
    .array(
      z.object({
        id: z.string(),
        username: z.string(),
        avatar: z.string(),
        role: z.enum(["owner", "editor", "viewer"]),
      }),
    )
    .optional(),
  totalDuration: z.string(),
  viewHistory: z
    .array(
      z.object({
        date: z.string(),
        views: z.number(),
      }),
    )
    .optional(),
});

// Inferred types
export type PlaylistFilters = z.infer<typeof PlaylistFiltersSchema>;
export type PlaylistSort = z.infer<typeof PlaylistSortSchema>;
export type PlaylistItem = z.infer<typeof PlaylistItemSchema>;
export type PlaylistDetail = z.infer<typeof PlaylistDetailSchema>;

// Mock data - extending the existing playlists
const mockPlaylists: (Playlist & {
  createdAt: string;
  updatedAt: string;
  category: string;
  description?: string;
})[] = [
  {
    id: 1,
    title: "VSPOメンバー最強ゲーミングモーメント集",
    creator: "ゲーム切り抜き師",
    creatorBadge: "🎮",
    thumbnail: "/placeholder.svg?height=180&width=320",
    videoCount: 25,
    views: "156.3K",
    topVideo: "【VSPO】全員でAPEX大会優勝の瞬間！",
    isHot: true,
    likes: 3421,
    watchPartyCount: 8,
    tags: ["ゲーム実況", "APEX", "FPS"],
    category: "gaming",
    createdAt: "2024-01-10T09:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
    description:
      "VSPO!メンバーの神がかったゲーミング瞬間を厳選！FPS、バトロワを中心とした最高のプレイ集です。",
  },
  {
    id: 2,
    title: "癒やしボイスASMR完全版",
    creator: "ASMR愛好家",
    creatorBadge: "🎧",
    thumbnail: "/placeholder.svg?height=180&width=320",
    videoCount: 42,
    views: "98.7K",
    topVideo: "【耳かき】優しい囁き声で安眠導入",
    isHot: false,
    likes: 2156,
    watchPartyCount: 3,
    tags: ["ASMR", "癒やし", "睡眠導入"],
    category: "asmr",
    createdAt: "2024-01-05T20:00:00Z",
    updatedAt: "2024-01-14T22:15:00Z",
    description:
      "心と体を癒すASMR配信の決定版。睡眠前のリラックスタイムにぴったりです。",
  },
  {
    id: 3,
    title: "VSPOコラボ配信名場面集2024",
    creator: "コラボまとめ職人",
    creatorBadge: "🤝",
    thumbnail: "/placeholder.svg?height=180&width=320",
    videoCount: 18,
    views: "234.5K",
    topVideo: "【大爆笑】6人でマイクラ建築対決！",
    isHot: true,
    likes: 5678,
    watchPartyCount: 12,
    tags: ["コラボ", "マイクラ", "爆笑"],
    category: "collab",
    createdAt: "2024-01-08T15:30:00Z",
    updatedAt: "2024-01-16T11:45:00Z",
    description:
      "2024年のVSPO!コラボ配信から選りすぐりの名場面をお届け！笑いあり感動ありの決定版です。",
  },
  {
    id: 4,
    title: "神歌ってみた集 - ボカロ編",
    creator: "歌ってみたファン",
    creatorBadge: "🎵",
    thumbnail: "/placeholder.svg?height=180&width=320",
    videoCount: 35,
    views: "187.2K",
    topVideo: "【歌ってみた】シャルル - 感動の熱唱",
    isHot: true,
    likes: 4532,
    watchPartyCount: 6,
    tags: ["歌ってみた", "ボカロ", "音楽"],
    category: "music",
    createdAt: "2024-01-03T18:00:00Z",
    updatedAt: "2024-01-13T16:20:00Z",
    description:
      "心に響くボカロ楽曲の歌ってみたを厳選。美しい歌声に酔いしれてください。",
  },
  {
    id: 5,
    title: "お絵描き配信タイムラプス集",
    creator: "イラスト好き",
    creatorBadge: "🎨",
    thumbnail: "/placeholder.svg?height=180&width=320",
    videoCount: 15,
    views: "67.8K",
    topVideo: "【お絵描き】3時間で描く推しの肖像画",
    isHot: false,
    likes: 1234,
    watchPartyCount: 2,
    tags: ["お絵描き", "イラスト", "アート"],
    category: "art",
    createdAt: "2024-01-01T12:00:00Z",
    updatedAt: "2024-01-12T10:30:00Z",
    description:
      "創作過程が見える貴重なお絵描き配信集。上達のヒントも満載です。",
  },
  {
    id: 6,
    title: "雑談配信の神回まとめ",
    creator: "雑談大好き",
    creatorBadge: "💬",
    thumbnail: "/placeholder.svg?height=180&width=320",
    videoCount: 28,
    views: "145.6K",
    topVideo: "【雑談】深夜の本音トークで号泣",
    isHot: false,
    likes: 3789,
    watchPartyCount: 5,
    tags: ["雑談", "感動", "本音"],
    category: "talk",
    createdAt: "2023-12-28T19:30:00Z",
    updatedAt: "2024-01-11T21:00:00Z",
    description:
      "心に残る雑談配信の名シーン集。リスナーとの絆を感じられる特別な瞬間たち。",
  },
  {
    id: 7,
    title: "料理配信の失敗＆成功集",
    creator: "料理配信ファン",
    creatorBadge: "🍳",
    thumbnail: "/placeholder.svg?height=180&width=320",
    videoCount: 12,
    views: "89.3K",
    topVideo: "【料理】奇跡の失敗からの大成功！",
    isHot: false,
    likes: 2345,
    watchPartyCount: 4,
    tags: ["料理", "失敗", "成功"],
    category: "cooking",
    createdAt: "2023-12-25T14:15:00Z",
    updatedAt: "2024-01-09T17:45:00Z",
    description:
      "料理配信の面白エピソード満載！失敗も成功も含めて楽しめる内容です。",
  },
  {
    id: 8,
    title: "記念配信・重大発表まとめ",
    creator: "記念日収集家",
    creatorBadge: "🎉",
    thumbnail: "/placeholder.svg?height=180&width=320",
    videoCount: 20,
    views: "312.4K",
    topVideo: "【重大発表】新衣装お披露目で視聴者爆増",
    isHot: true,
    likes: 6789,
    watchPartyCount: 15,
    tags: ["記念配信", "重大発表", "新衣装"],
    category: "special",
    createdAt: "2023-12-20T16:00:00Z",
    updatedAt: "2024-01-14T13:20:00Z",
    description:
      "特別な日の記念配信や重大発表の瞬間を収録。歴史的な瞬間をお見逃しなく！",
  },
];

// Mock playlist items for detailed view
const mockPlaylistItems: Record<number, PlaylistItem[]> = {
  1: [
    {
      id: "item_1_1",
      title: "【APEX】橘ひなの 1vs3クラッチの神業",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "2:45",
      addedAt: "2024-01-15T14:30:00Z",
      order: 1,
      vtuber: "橘ひなの",
      clipper: "FPSクリップ職人",
    },
    {
      id: "item_1_2",
      title: "【VALORANT】藍沢エマのエース決定瞬間",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "1:58",
      addedAt: "2024-01-14T12:15:00Z",
      order: 2,
      vtuber: "藍沢エマ",
      clipper: "FPSクリップ職人",
    },
    {
      id: "item_1_3",
      title: "【APEX】VSPOチーム優勝の瞬間！",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "4:12",
      addedAt: "2024-01-13T18:45:00Z",
      order: 3,
      vtuber: "VSPO!",
      clipper: "大会クリップ師",
    },
  ],
  2: [
    {
      id: "item_2_1",
      title: "【ASMR】優しい耳かき音で安眠",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "23:15",
      addedAt: "2024-01-14T22:15:00Z",
      order: 1,
      vtuber: "一ノ瀬うるは",
      clipper: "ASMR切り抜き",
    },
    {
      id: "item_2_2",
      title: "【癒やし】囁き声雑談ASMR",
      thumbnail: "/placeholder.svg?height=90&width=160",
      duration: "18:30",
      addedAt: "2024-01-12T20:00:00Z",
      order: 2,
      vtuber: "胡桃のあ",
      clipper: "ASMR愛好家",
    },
  ],
};

class PlaylistService extends BaseService {
  /**
   * Get all playlists with filtering, sorting, and pagination
   */
  static async getPlaylists(
    filters?: PlaylistFilters,
    sort?: PlaylistSort,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Playlist>> {
    await PlaylistService.simulateNetworkDelay(200, 600);

    try {
      const validatedPagination = validatePagination(pagination || {});
      const validatedFilters = PlaylistFiltersSchema.parse(filters || {});
      const validatedSort = PlaylistSortSchema.parse(sort || {});

      // Check cache
      const cacheKey = `playlists_${JSON.stringify({ filters: validatedFilters, sort: validatedSort, pagination: validatedPagination })}`;
      const cached =
        PlaylistService.getCache<PaginatedResponse<Playlist>>(cacheKey);
      if (cached) {
        return { ...cached, meta: { ...cached.meta, cached: true } };
      }

      let filteredData = [...mockPlaylists];

      // Apply filters
      if (validatedFilters.creator) {
        filteredData = filteredData.filter((playlist) =>
          playlist.creator
            .toLowerCase()
            .includes(validatedFilters.creator?.toLowerCase()),
        );
      }

      if (validatedFilters.isHot !== undefined) {
        filteredData = filteredData.filter(
          (playlist) => playlist.isHot === validatedFilters.isHot,
        );
      }

      if (validatedFilters.minVideoCount) {
        filteredData = filteredData.filter(
          (playlist) => playlist.videoCount >= validatedFilters.minVideoCount!,
        );
      }

      if (validatedFilters.maxVideoCount) {
        filteredData = filteredData.filter(
          (playlist) => playlist.videoCount <= validatedFilters.maxVideoCount!,
        );
      }

      if (validatedFilters.minLikes) {
        filteredData = filteredData.filter(
          (playlist) => playlist.likes >= validatedFilters.minLikes!,
        );
      }

      if (validatedFilters.minWatchParties) {
        filteredData = filteredData.filter(
          (playlist) =>
            playlist.watchPartyCount >= validatedFilters.minWatchParties!,
        );
      }

      if (validatedFilters.category && validatedFilters.category !== "all") {
        filteredData = filteredData.filter(
          (playlist) => playlist.category === validatedFilters.category,
        );
      }

      if (validatedFilters.hasActiveWatchParty !== undefined) {
        filteredData = filteredData.filter(
          (playlist) =>
            playlist.watchPartyCount > 0 ===
            validatedFilters.hasActiveWatchParty,
        );
      }

      if (validatedFilters.searchQuery) {
        filteredData = PlaylistService.filterBySearch(
          filteredData,
          validatedFilters.searchQuery,
          ["title", "creator", "topVideo", "tags", "description"],
        );
      }

      if (validatedFilters.tags && validatedFilters.tags.length > 0) {
        filteredData = filteredData.filter((playlist) =>
          validatedFilters.tags?.some((tag) => playlist.tags.includes(tag)),
        );
      }

      // Apply sorting
      if (validatedSort.field === "trending") {
        // Custom trending algorithm: combine isHot, likes, and watchPartyCount
        filteredData.sort((a, b) => {
          const aScore =
            (a.isHot ? 1000 : 0) + a.likes + a.watchPartyCount * 100;
          const bScore =
            (b.isHot ? 1000 : 0) + b.likes + b.watchPartyCount * 100;
          return validatedSort.direction === "desc"
            ? bScore - aScore
            : aScore - bScore;
        });
      } else if (validatedSort.field === "views") {
        filteredData.sort((a, b) => {
          const aViews = Number.parseFloat(a.views.replace(/[KM]/g, ""));
          const bViews = Number.parseFloat(b.views.replace(/[KM]/g, ""));
          return validatedSort.direction === "desc"
            ? bViews - aViews
            : aViews - bViews;
        });
      } else {
        filteredData = PlaylistService.sortArray(filteredData, {
          field: validatedSort.field,
          direction: validatedSort.direction,
        });
      }

      // Apply pagination
      const { items, total } = PlaylistService.paginateArray(
        filteredData,
        validatedPagination,
      );
      const paginationMeta = PlaylistService.calculatePagination(
        total,
        validatedPagination.page,
        validatedPagination.limit,
      );

      // Convert to base Playlist type (remove extended fields)
      const playlistsResponse = items.map((item) => ({
        id: item.id,
        title: item.title,
        creator: item.creator,
        creatorBadge: item.creatorBadge,
        thumbnail: item.thumbnail,
        videoCount: item.videoCount,
        views: item.views,
        topVideo: item.topVideo,
        isHot: item.isHot,
        likes: item.likes,
        watchPartyCount: item.watchPartyCount,
        tags: item.tags,
      }));

      const response = PlaylistService.createPaginatedResponse(
        playlistsResponse,
        paginationMeta,
      );
      PlaylistService.setCache(cacheKey, response, 10);

      return response;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to fetch playlists: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get a single playlist by ID with detailed information
   */
  static async getPlaylistById(
    id: number,
  ): Promise<ApiResponse<PlaylistDetail>> {
    await PlaylistService.simulateNetworkDelay(150, 400);

    try {
      const validatedId = validateNumber(id, "Playlist ID");

      const cacheKey = `playlist_detail_${validatedId}`;
      const cached = PlaylistService.getCache<PlaylistDetail>(cacheKey);
      if (cached) {
        return PlaylistService.createResponse(cached, true);
      }

      const playlist = mockPlaylists.find((p) => p.id === validatedId);
      if (!playlist) {
        throw new NotFoundError("Playlist", validatedId.toString());
      }

      const items = mockPlaylistItems[validatedId] || [];

      // Calculate total duration
      const totalSeconds = items.reduce((sum, item) => {
        const [minutes, seconds] = item.duration.split(":").map(Number);
        return sum + (minutes * 60 + seconds);
      }, 0);

      const totalHours = Math.floor(totalSeconds / 3600);
      const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
      const totalDuration =
        totalHours > 0
          ? `${totalHours}:${totalMinutes.toString().padStart(2, "0")}:${(totalSeconds % 60).toString().padStart(2, "0")}`
          : `${totalMinutes}:${(totalSeconds % 60).toString().padStart(2, "0")}`;

      const playlistDetail: PlaylistDetail = {
        ...playlist,
        description: playlist.description,
        items,
        totalDuration,
        isPrivate: false,
        collaborators: [
          {
            id: "user_1",
            username: playlist.creator,
            avatar: "/placeholder.svg?height=40&width=40",
            role: "owner",
          },
        ],
        viewHistory: [
          { date: "2024-01-15", views: 1234 },
          { date: "2024-01-14", views: 1098 },
          { date: "2024-01-13", views: 1456 },
          { date: "2024-01-12", views: 987 },
          { date: "2024-01-11", views: 1567 },
        ],
      };

      PlaylistService.setCache(cacheKey, playlistDetail, 20);
      return PlaylistService.createResponse(playlistDetail);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to fetch playlist: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get playlists by creator
   */
  static async getPlaylistsByCreator(
    creatorName: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Playlist>> {
    if (!creatorName.trim()) {
      throw new ValidationError("Creator name cannot be empty");
    }

    return PlaylistService.getPlaylists(
      { creator: creatorName.trim() },
      undefined,
      pagination,
    );
  }

  /**
   * Get trending playlists
   */
  static async getTrendingPlaylists(
    limit = 10,
  ): Promise<ApiResponse<Playlist[]>> {
    await PlaylistService.simulateNetworkDelay(150, 400);

    try {
      const cacheKey = `trending_playlists_${limit}`;
      const cached = PlaylistService.getCache<Playlist[]>(cacheKey);
      if (cached) {
        return PlaylistService.createResponse(cached, true);
      }

      const trending = [...mockPlaylists]
        .filter((playlist) => playlist.isHot)
        .sort((a, b) => {
          const aScore = a.likes + a.watchPartyCount * 100;
          const bScore = b.likes + b.watchPartyCount * 100;
          return bScore - aScore;
        })
        .slice(0, limit)
        .map((item) => ({
          id: item.id,
          title: item.title,
          creator: item.creator,
          creatorBadge: item.creatorBadge,
          thumbnail: item.thumbnail,
          videoCount: item.videoCount,
          views: item.views,
          topVideo: item.topVideo,
          isHot: item.isHot,
          likes: item.likes,
          watchPartyCount: item.watchPartyCount,
          tags: item.tags,
        }));

      PlaylistService.setCache(cacheKey, trending, 5);
      return PlaylistService.createResponse(trending);
    } catch (error) {
      throw new Error(
        `Failed to fetch trending playlists: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get playlist analytics
   */
  static async getPlaylistAnalytics(): Promise<
    ApiResponse<{
      totalPlaylists: number;
      totalVideos: number;
      totalViews: string;
      totalLikes: number;
      averageVideosPerPlaylist: number;
      hotPlaylists: number;
      topCreators: Array<{
        name: string;
        playlistCount: number;
        totalLikes: number;
      }>;
      categoryDistribution: Record<string, number>;
    }>
  > {
    await PlaylistService.simulateNetworkDelay(200, 500);

    try {
      const cacheKey = "playlist_analytics";
      const cached = PlaylistService.getCache(cacheKey);
      if (cached) {
        return PlaylistService.createResponse(cached, true);
      }

      const totalPlaylists = mockPlaylists.length;
      const totalVideos = mockPlaylists.reduce(
        (sum, p) => sum + p.videoCount,
        0,
      );
      const totalLikes = mockPlaylists.reduce((sum, p) => sum + p.likes, 0);
      const averageVideosPerPlaylist = totalVideos / totalPlaylists;
      const hotPlaylists = mockPlaylists.filter((p) => p.isHot).length;

      // Calculate total views (simplified)
      const totalViewsNum = mockPlaylists.reduce((sum, playlist) => {
        const views =
          Number.parseFloat(playlist.views.replace(/[KM]/g, "")) *
          (playlist.views.includes("K")
            ? 1000
            : playlist.views.includes("M")
              ? 1000000
              : 1);
        return sum + views;
      }, 0);
      const totalViews =
        totalViewsNum > 1000000
          ? `${(totalViewsNum / 1000000).toFixed(1)}M`
          : `${(totalViewsNum / 1000).toFixed(1)}K`;

      // Top creators
      const creatorStats = new Map<
        string,
        { playlistCount: number; totalLikes: number }
      >();
      mockPlaylists.forEach((playlist) => {
        const existing = creatorStats.get(playlist.creator) || {
          playlistCount: 0,
          totalLikes: 0,
        };
        creatorStats.set(playlist.creator, {
          playlistCount: existing.playlistCount + 1,
          totalLikes: existing.totalLikes + playlist.likes,
        });
      });

      const topCreators = Array.from(creatorStats.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.playlistCount - a.playlistCount)
        .slice(0, 5);

      // Category distribution
      const categoryDistribution: Record<string, number> = {};
      mockPlaylists.forEach((playlist) => {
        categoryDistribution[playlist.category] =
          (categoryDistribution[playlist.category] || 0) + 1;
      });

      const analytics = {
        totalPlaylists,
        totalVideos,
        totalViews,
        totalLikes,
        averageVideosPerPlaylist:
          Math.round(averageVideosPerPlaylist * 10) / 10,
        hotPlaylists,
        topCreators,
        categoryDistribution,
      };

      PlaylistService.setCache(cacheKey, analytics, 60);
      return PlaylistService.createResponse(analytics);
    } catch (error) {
      throw new Error(
        `Failed to fetch playlist analytics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get available categories for filtering
   */
  static async getPlaylistCategories(): Promise<ApiResponse<string[]>> {
    const categories = [
      "gaming",
      "music",
      "collab",
      "asmr",
      "art",
      "talk",
      "cooking",
      "special",
      "horror",
      "educational",
    ];

    return PlaylistService.createResponse(categories);
  }

  /**
   * Add item to playlist (mock operation)
   */
  static async addItemToPlaylist(
    playlistId: number,
    itemData: Omit<PlaylistItem, "id" | "addedAt" | "order">,
  ): Promise<ApiResponse<PlaylistItem>> {
    await PlaylistService.simulateNetworkDelay(300, 700);

    try {
      const validatedId = validateNumber(playlistId, "Playlist ID");

      const playlist = mockPlaylists.find((p) => p.id === validatedId);
      if (!playlist) {
        throw new NotFoundError("Playlist", validatedId.toString());
      }

      const newItem: PlaylistItem = {
        id: `item_${validatedId}_${Date.now()}`,
        ...itemData,
        addedAt: new Date().toISOString(),
        order: (mockPlaylistItems[validatedId]?.length || 0) + 1,
      };

      // Simulate adding to playlist items
      if (!mockPlaylistItems[validatedId]) {
        mockPlaylistItems[validatedId] = [];
      }
      mockPlaylistItems[validatedId].push(newItem);

      // Clear related cache
      PlaylistService.clearCache(`playlist_detail_${validatedId}`);
      PlaylistService.clearCache("playlist");

      return PlaylistService.createResponse(newItem);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to add item to playlist: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Remove item from playlist (mock operation)
   */
  static async removeItemFromPlaylist(
    playlistId: number,
    itemId: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    await PlaylistService.simulateNetworkDelay(200, 500);

    try {
      const validatedPlaylistId = validateNumber(playlistId, "Playlist ID");
      const validatedItemId = validateId(itemId, "Item ID");

      const playlist = mockPlaylists.find((p) => p.id === validatedPlaylistId);
      if (!playlist) {
        throw new NotFoundError("Playlist", validatedPlaylistId.toString());
      }

      const items = mockPlaylistItems[validatedPlaylistId];
      if (!items) {
        throw new NotFoundError(
          "Playlist items",
          validatedPlaylistId.toString(),
        );
      }

      const itemIndex = items.findIndex((item) => item.id === validatedItemId);
      if (itemIndex === -1) {
        throw new NotFoundError("Playlist item", validatedItemId);
      }

      // Simulate removing from playlist items
      items.splice(itemIndex, 1);

      // Update order for remaining items
      items.forEach((item, index) => {
        item.order = index + 1;
      });

      // Clear related cache
      PlaylistService.clearCache(`playlist_detail_${validatedPlaylistId}`);
      PlaylistService.clearCache("playlist");

      return PlaylistService.createResponse({ success: true });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to remove item from playlist: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export default PlaylistService;

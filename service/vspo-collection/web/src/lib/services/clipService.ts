import { z } from "zod";
import { type Clip, ClipSchema } from "../../common/types/schemas";
import {
  type ApiResponse,
  type BaseDateRange,
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

// Clip-specific schemas
export const ClipFiltersSchema = z.object({
  vtuber: z.string().optional(),
  clipper: z.string().optional(),
  isExclusive: z.boolean().optional(),
  hasWatchParty: z.boolean().optional(),
  minDuration: z.number().optional(), // in seconds
  maxDuration: z.number().optional(), // in seconds
  minViews: z.number().optional(),
  maxViews: z.number().optional(),
  minLikes: z.number().optional(),
  category: z
    .enum([
      "all",
      "gaming",
      "singing",
      "chatting",
      "drawing",
      "cooking",
      "collaboration",
      "asmr",
      "horror",
      "music",
      "educational",
    ])
    .optional(),
  language: z.enum(["ja", "en", "ko", "cn", "tw", "all"]).optional(),
  platform: z
    .enum(["youtube", "twitch", "twitcasting", "niconico", "all"])
    .optional(),
  searchQuery: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
});

export const ClipSortSchema = z.object({
  field: z
    .enum([
      "title",
      "vtuber",
      "views",
      "likes",
      "comments",
      "duration",
      "createdAt",
      "relevance",
    ])
    .default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export const ClipAnalyticsSchema = z.object({
  totalViews: z.number(),
  totalLikes: z.number(),
  totalComments: z.number(),
  averageDuration: z.number(),
  topVTubers: z.array(
    z.object({
      name: z.string(),
      clipCount: z.number(),
      totalViews: z.number(),
    }),
  ),
  topClippers: z.array(
    z.object({
      name: z.string(),
      clipCount: z.number(),
      totalViews: z.number(),
    }),
  ),
  viewsByCategory: z.record(z.string(), z.number()),
  viewsByMonth: z.array(
    z.object({
      month: z.string(),
      views: z.number(),
      clips: z.number(),
    }),
  ),
});

// Inferred types
export type ClipFilters = z.infer<typeof ClipFiltersSchema>;
export type ClipSort = z.infer<typeof ClipSortSchema>;
export type ClipAnalytics = z.infer<typeof ClipAnalyticsSchema>;

// Mock data
const mockClips: (Clip & {
  category: string;
  language: string;
  platform: string;
  createdAt: string;
  tags: string[];
  description?: string;
  url: string;
})[] = [
  {
    id: 1,
    title: "【VSPO】橘ひなの、APEXで奇跡の1vs3クラッチ！",
    vtuber: "橘ひなの",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "2:45",
    views: "324.5K",
    clipper: "FPSクリップ職人",
    isExclusive: false,
    likes: 8542,
    comments: 234,
    watchPartyActive: true,
    category: "gaming",
    language: "ja",
    platform: "youtube",
    createdAt: "2024-01-15T10:30:00Z",
    tags: ["APEX", "クラッチ", "神プレイ", "FPS"],
    description: "橘ひなのちゃんのAPEXで見せた奇跡の1vs3クラッチシーン！",
    url: "https://youtube.com/watch?v=example1",
  },
  {
    id: 2,
    title: "【歌枠】藍沢エマの『シャルル』が神すぎる件",
    vtuber: "藍沢エマ",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "4:12",
    views: "189.3K",
    clipper: "歌ってみた切り抜き師",
    isExclusive: true,
    likes: 6789,
    comments: 156,
    watchPartyActive: false,
    category: "singing",
    language: "ja",
    platform: "youtube",
    createdAt: "2024-01-14T19:45:00Z",
    tags: ["歌ってみた", "シャルル", "感動", "ボカロ"],
    description: "エマちゃんのシャルルが本当に美しい...",
    url: "https://youtube.com/watch?v=example2",
  },
  {
    id: 3,
    title: "【雑談】一ノ瀬うるはの深夜の本音トーク",
    vtuber: "一ノ瀬うるは",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "8:23",
    views: "145.7K",
    clipper: "雑談切り抜き",
    isExclusive: false,
    likes: 4321,
    comments: 89,
    watchPartyActive: false,
    category: "chatting",
    language: "ja",
    platform: "youtube",
    createdAt: "2024-01-13T23:15:00Z",
    tags: ["雑談", "本音", "深夜", "癒やし"],
    description: "うるはちゃんの心に響く深夜トーク",
    url: "https://youtube.com/watch?v=example3",
  },
  {
    id: 4,
    title: "【お絵描き】胡桃のあ、3時間で推しの絵を完成させる",
    vtuber: "胡桃のあ",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "12:34",
    views: "98.4K",
    clipper: "アート系切り抜き",
    isExclusive: false,
    likes: 3456,
    comments: 67,
    watchPartyActive: true,
    category: "drawing",
    language: "ja",
    platform: "youtube",
    createdAt: "2024-01-12T14:20:00Z",
    tags: ["お絵描き", "イラスト", "タイムラプス"],
    description: "のあちゃんの絵が上達していく過程が見れる貴重な配信",
    url: "https://youtube.com/watch?v=example4",
  },
  {
    id: 5,
    title: "【EN】Zentreya's Epic Valorant Ace!",
    vtuber: "Zentreya",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "1:58",
    views: "267.8K",
    clipper: "EN Clips Master",
    isExclusive: false,
    likes: 7890,
    comments: 345,
    watchPartyActive: true,
    category: "gaming",
    language: "en",
    platform: "twitch",
    createdAt: "2024-01-11T16:45:00Z",
    tags: ["VALORANT", "Ace", "FPS", "Epic"],
    description: "Zentreya showing off incredible Valorant skills!",
    url: "https://twitch.tv/videos/example5",
  },
  {
    id: 6,
    title: "【コラボ】VSPO全員でAmong Us大混戦！",
    vtuber: "VSPO!",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "15:47",
    views: "456.2K",
    clipper: "コラボ切り抜き王",
    isExclusive: true,
    likes: 12345,
    comments: 678,
    watchPartyActive: true,
    category: "collaboration",
    language: "ja",
    platform: "youtube",
    createdAt: "2024-01-10T20:00:00Z",
    tags: ["コラボ", "Among Us", "大型コラボ", "爆笑"],
    description: "VSPO!メンバー全員参加の超大型コラボ配信！",
    url: "https://youtube.com/watch?v=example6",
  },
  {
    id: 7,
    title: "【ASMR】癒やしボイスで安眠導入",
    vtuber: "一ノ瀬うるは",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "23:15",
    views: "234.1K",
    clipper: "ASMR切り抜き",
    isExclusive: false,
    likes: 5678,
    comments: 123,
    watchPartyActive: false,
    category: "asmr",
    language: "ja",
    platform: "youtube",
    createdAt: "2024-01-09T22:30:00Z",
    tags: ["ASMR", "癒やし", "安眠", "囁き"],
    description: "うるはちゃんの優しい声で心が癒される...",
    url: "https://youtube.com/watch?v=example7",
  },
  {
    id: 8,
    title: "【ホラー】橘ひなの、バイオハザードで絶叫連発",
    vtuber: "橘ひなの",
    thumbnail: "/placeholder.svg?height=180&width=320",
    duration: "6:42",
    views: "178.9K",
    clipper: "ホラー切り抜き師",
    isExclusive: false,
    likes: 4567,
    comments: 198,
    watchPartyActive: false,
    category: "horror",
    language: "ja",
    platform: "youtube",
    createdAt: "2024-01-08T19:15:00Z",
    tags: ["ホラー", "バイオハザード", "絶叫", "リアクション"],
    description: "ひなのちゃんの可愛い絶叫が止まらない！",
    url: "https://youtube.com/watch?v=example8",
  },
];

class ClipService extends BaseService {
  /**
   * Get all clips with filtering, sorting, and pagination
   */
  static async getClips(
    filters?: ClipFilters,
    sort?: ClipSort,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Clip>> {
    await ClipService.simulateNetworkDelay(300, 800);

    try {
      const validatedPagination = validatePagination(pagination || {});
      const validatedFilters = ClipFiltersSchema.parse(filters || {});
      const validatedSort = ClipSortSchema.parse(sort || {});

      // Check cache
      const cacheKey = `clips_${JSON.stringify({ filters: validatedFilters, sort: validatedSort, pagination: validatedPagination })}`;
      const cached = ClipService.getCache<PaginatedResponse<Clip>>(cacheKey);
      if (cached) {
        return { ...cached, meta: { ...cached.meta, cached: true } };
      }

      let filteredData = [...mockClips];

      // Apply filters
      if (validatedFilters.vtuber) {
        filteredData = filteredData.filter((clip) =>
          clip.vtuber
            .toLowerCase()
            .includes(validatedFilters.vtuber?.toLowerCase()),
        );
      }

      if (validatedFilters.clipper) {
        filteredData = filteredData.filter((clip) =>
          clip.clipper
            .toLowerCase()
            .includes(validatedFilters.clipper?.toLowerCase()),
        );
      }

      if (validatedFilters.isExclusive !== undefined) {
        filteredData = filteredData.filter(
          (clip) => clip.isExclusive === validatedFilters.isExclusive,
        );
      }

      if (validatedFilters.hasWatchParty !== undefined) {
        filteredData = filteredData.filter(
          (clip) => clip.watchPartyActive === validatedFilters.hasWatchParty,
        );
      }

      if (validatedFilters.category && validatedFilters.category !== "all") {
        filteredData = filteredData.filter(
          (clip) => clip.category === validatedFilters.category,
        );
      }

      if (validatedFilters.language && validatedFilters.language !== "all") {
        filteredData = filteredData.filter(
          (clip) => clip.language === validatedFilters.language,
        );
      }

      if (validatedFilters.platform && validatedFilters.platform !== "all") {
        filteredData = filteredData.filter(
          (clip) => clip.platform === validatedFilters.platform,
        );
      }

      if (validatedFilters.minLikes) {
        filteredData = filteredData.filter(
          (clip) => clip.likes >= validatedFilters.minLikes!,
        );
      }

      if (validatedFilters.searchQuery) {
        filteredData = ClipService.filterBySearch(
          filteredData,
          validatedFilters.searchQuery,
          ["title", "vtuber", "clipper", "tags", "description"],
        );
      }

      if (validatedFilters.tags && validatedFilters.tags.length > 0) {
        filteredData = filteredData.filter((clip) =>
          validatedFilters.tags?.some((tag) => clip.tags.includes(tag)),
        );
      }

      // Apply date range filter
      if (validatedFilters.dateRange?.from || validatedFilters.dateRange?.to) {
        filteredData = filteredData.filter((clip) => {
          const clipDate = new Date(clip.createdAt);
          const fromDate = validatedFilters.dateRange?.from
            ? new Date(validatedFilters.dateRange.from)
            : null;
          const toDate = validatedFilters.dateRange?.to
            ? new Date(validatedFilters.dateRange.to)
            : null;

          if (fromDate && clipDate < fromDate) return false;
          if (toDate && clipDate > toDate) return false;
          return true;
        });
      }

      // Apply sorting
      if (validatedSort.field === "views") {
        filteredData.sort((a, b) => {
          const aViews = Number.parseFloat(a.views.replace(/[KM]/g, ""));
          const bViews = Number.parseFloat(b.views.replace(/[KM]/g, ""));
          return validatedSort.direction === "desc"
            ? bViews - aViews
            : aViews - bViews;
        });
      } else {
        filteredData = ClipService.sortArray(filteredData, {
          field: validatedSort.field,
          direction: validatedSort.direction,
        });
      }

      // Apply pagination
      const { items, total } = ClipService.paginateArray(
        filteredData,
        validatedPagination,
      );
      const paginationMeta = ClipService.calculatePagination(
        total,
        validatedPagination.page,
        validatedPagination.limit,
      );

      // Convert to base Clip type (remove extended fields)
      const clipsResponse = items.map((item) => ({
        id: item.id,
        title: item.title,
        vtuber: item.vtuber,
        thumbnail: item.thumbnail,
        duration: item.duration,
        views: item.views,
        clipper: item.clipper,
        isExclusive: item.isExclusive,
        likes: item.likes,
        comments: item.comments,
        watchPartyActive: item.watchPartyActive,
      }));

      const response = ClipService.createPaginatedResponse(
        clipsResponse,
        paginationMeta,
      );

      // Cache the response
      ClipService.setCache(cacheKey, response, 5); // Cache for 5 minutes

      return response;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to fetch clips: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get a single clip by ID
   */
  static async getClipById(
    id: number,
  ): Promise<
    ApiResponse<Clip & { url: string; description?: string; tags: string[] }>
  > {
    await ClipService.simulateNetworkDelay(100, 300);

    try {
      const validatedId = validateNumber(id, "Clip ID");

      const cacheKey = `clip_${validatedId}`;
      const cached = ClipService.getCache(cacheKey);
      if (cached) {
        return ClipService.createResponse(cached, true);
      }

      const clip = mockClips.find((c) => c.id === validatedId);
      if (!clip) {
        throw new NotFoundError("Clip", validatedId.toString());
      }

      ClipService.setCache(cacheKey, clip, 15);
      return ClipService.createResponse(clip);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to fetch clip: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get clips by VTuber
   */
  static async getClipsByVTuber(
    vtuberName: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Clip>> {
    if (!vtuberName.trim()) {
      throw new ValidationError("VTuber name cannot be empty");
    }

    return ClipService.getClips(
      { vtuber: vtuberName.trim() },
      undefined,
      pagination,
    );
  }

  /**
   * Get trending clips (most likes in recent period)
   */
  static async getTrendingClips(limit = 10): Promise<ApiResponse<Clip[]>> {
    await ClipService.simulateNetworkDelay(200, 500);

    try {
      const cacheKey = `trending_clips_${limit}`;
      const cached = ClipService.getCache<Clip[]>(cacheKey);
      if (cached) {
        return ClipService.createResponse(cached, true);
      }

      // Filter recent clips (last 7 days) and sort by likes
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);

      const trending = mockClips
        .filter((clip) => new Date(clip.createdAt) >= recentDate)
        .sort((a, b) => b.likes - a.likes)
        .slice(0, limit)
        .map((item) => ({
          id: item.id,
          title: item.title,
          vtuber: item.vtuber,
          thumbnail: item.thumbnail,
          duration: item.duration,
          views: item.views,
          clipper: item.clipper,
          isExclusive: item.isExclusive,
          likes: item.likes,
          comments: item.comments,
          watchPartyActive: item.watchPartyActive,
        }));

      ClipService.setCache(cacheKey, trending, 10);
      return ClipService.createResponse(trending);
    } catch (error) {
      throw new Error(
        `Failed to fetch trending clips: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get clip analytics
   */
  static async getClipAnalytics(): Promise<ApiResponse<ClipAnalytics>> {
    await ClipService.simulateNetworkDelay(300, 600);

    try {
      const cacheKey = "clip_analytics";
      const cached = ClipService.getCache<ClipAnalytics>(cacheKey);
      if (cached) {
        return ClipService.createResponse(cached, true);
      }

      // Calculate analytics from mock data
      const totalViews = mockClips.reduce((sum, clip) => {
        const views =
          Number.parseFloat(clip.views.replace(/[KM]/g, "")) *
          (clip.views.includes("K")
            ? 1000
            : clip.views.includes("M")
              ? 1000000
              : 1);
        return sum + views;
      }, 0);

      const totalLikes = mockClips.reduce((sum, clip) => sum + clip.likes, 0);
      const totalComments = mockClips.reduce(
        (sum, clip) => sum + clip.comments,
        0,
      );

      // Average duration in seconds
      const averageDuration =
        mockClips.reduce((sum, clip) => {
          const [minutes, seconds] = clip.duration.split(":").map(Number);
          return sum + (minutes * 60 + seconds);
        }, 0) / mockClips.length;

      // Top VTubers by clip count
      const vtuberStats = new Map<
        string,
        { clipCount: number; totalViews: number }
      >();
      mockClips.forEach((clip) => {
        const views =
          Number.parseFloat(clip.views.replace(/[KM]/g, "")) *
          (clip.views.includes("K")
            ? 1000
            : clip.views.includes("M")
              ? 1000000
              : 1);
        const existing = vtuberStats.get(clip.vtuber) || {
          clipCount: 0,
          totalViews: 0,
        };
        vtuberStats.set(clip.vtuber, {
          clipCount: existing.clipCount + 1,
          totalViews: existing.totalViews + views,
        });
      });

      const topVTubers = Array.from(vtuberStats.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.clipCount - a.clipCount)
        .slice(0, 5);

      // Top clippers by clip count
      const clipperStats = new Map<
        string,
        { clipCount: number; totalViews: number }
      >();
      mockClips.forEach((clip) => {
        const views =
          Number.parseFloat(clip.views.replace(/[KM]/g, "")) *
          (clip.views.includes("K")
            ? 1000
            : clip.views.includes("M")
              ? 1000000
              : 1);
        const existing = clipperStats.get(clip.clipper) || {
          clipCount: 0,
          totalViews: 0,
        };
        clipperStats.set(clip.clipper, {
          clipCount: existing.clipCount + 1,
          totalViews: existing.totalViews + views,
        });
      });

      const topClippers = Array.from(clipperStats.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.clipCount - a.clipCount)
        .slice(0, 5);

      // Views by category
      const viewsByCategory: Record<string, number> = {};
      mockClips.forEach((clip) => {
        const views =
          Number.parseFloat(clip.views.replace(/[KM]/g, "")) *
          (clip.views.includes("K")
            ? 1000
            : clip.views.includes("M")
              ? 1000000
              : 1);
        viewsByCategory[clip.category] =
          (viewsByCategory[clip.category] || 0) + views;
      });

      // Mock monthly data
      const viewsByMonth = [
        { month: "2024-01", views: 1500000, clips: 25 },
        { month: "2023-12", views: 1200000, clips: 20 },
        { month: "2023-11", views: 1800000, clips: 30 },
        { month: "2023-10", views: 1400000, clips: 22 },
        { month: "2023-09", views: 1600000, clips: 28 },
        { month: "2023-08", views: 1300000, clips: 18 },
      ];

      const analytics: ClipAnalytics = {
        totalViews,
        totalLikes,
        totalComments,
        averageDuration,
        topVTubers,
        topClippers,
        viewsByCategory,
        viewsByMonth,
      };

      ClipService.setCache(cacheKey, analytics, 60); // Cache for 1 hour
      return ClipService.createResponse(analytics);
    } catch (error) {
      throw new Error(
        `Failed to fetch clip analytics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get available categories for filtering
   */
  static async getClipCategories(): Promise<ApiResponse<string[]>> {
    const categories = [
      "gaming",
      "singing",
      "chatting",
      "drawing",
      "cooking",
      "collaboration",
      "asmr",
      "horror",
      "music",
      "educational",
    ];

    return ClipService.createResponse(categories);
  }

  /**
   * Get available tags for filtering
   */
  static async getClipTags(): Promise<ApiResponse<string[]>> {
    await ClipService.simulateNetworkDelay(50, 150);

    try {
      const cacheKey = "clip_tags";
      const cached = ClipService.getCache<string[]>(cacheKey);
      if (cached) {
        return ClipService.createResponse(cached, true);
      }

      const allTags = new Set<string>();
      mockClips.forEach((clip) => {
        clip.tags.forEach((tag) => allTags.add(tag));
      });

      const tags = Array.from(allTags).sort((a, b) => a.localeCompare(b, "ja"));

      ClipService.setCache(cacheKey, tags, 60);
      return ClipService.createResponse(tags);
    } catch (error) {
      throw new Error(
        `Failed to fetch clip tags: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export default ClipService;

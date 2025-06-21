import { z } from "zod";
import {
  type Creator,
  CreatorSchema,
  type MemberType,
} from "../../common/types/creator";
import {
  type ApiResponse,
  BaseService,
  type BaseSort,
  NotFoundError,
  type PaginatedResponse,
  type PaginationParams,
  ValidationError,
  validateId,
  validatePagination,
} from "./base";

// Creator-specific schemas
export const CreatorFiltersSchema = z.object({
  memberType: z
    .enum(["vspo_jp", "vspo_en", "vspo_ch", "vspo_all", "general"])
    .optional(),
  isActive: z.boolean().optional(),
  searchQuery: z.string().optional(),
  tags: z.array(z.string()).optional(),
  hasStats: z.boolean().optional(),
});

export const CreatorSortSchema = z.object({
  field: z
    .enum([
      "name",
      "totalClips",
      "totalViews",
      "monthlyViewers",
      "favoriteCount",
      "joinedDate",
    ])
    .default("name"),
  direction: z.enum(["asc", "desc"]).default("asc"),
});

// Inferred types
export type CreatorFilters = z.infer<typeof CreatorFiltersSchema>;
export type CreatorSort = z.infer<typeof CreatorSortSchema>;

// Mock data
const mockCreators: Creator[] = [
  {
    id: "1",
    name: "橘ひなの",
    avatar: "https://yt3.googleusercontent.com/example1",
    memberType: "vspo_jp",
    description: "VSPO!所属のゲーム好きVTuber。FPSとホラーゲームが得意です！",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://youtube.com/@tachibana_hinano",
        handle: "@tachibana_hinano",
        subscriberCount: 452000,
      },
      {
        platform: "twitter",
        url: "https://twitter.com/Tachibana_hina",
        handle: "@Tachibana_hina",
      },
    ],
    stats: {
      totalClips: 1250,
      totalViews: "2.3M",
      monthlyViewers: "180K",
      favoriteCount: 8500,
    },
    tags: ["FPS", "ホラー", "ゲーム実況", "歌ってみた"],
    joinedDate: "2020-11-20",
    isActive: true,
    color: "#FF69B4",
  },
  {
    id: "2",
    name: "藍沢エマ",
    avatar: "https://yt3.googleusercontent.com/example2",
    memberType: "vspo_jp",
    description: "VSPO!所属。APEXとVALORANTをメインにプレイしています。",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://youtube.com/@aizawa_ema",
        handle: "@aizawa_ema",
        subscriberCount: 385000,
      },
      {
        platform: "twitch",
        url: "https://twitch.tv/aizawa_ema",
        handle: "aizawa_ema",
      },
    ],
    stats: {
      totalClips: 980,
      totalViews: "1.8M",
      monthlyViewers: "145K",
      favoriteCount: 6200,
    },
    tags: ["APEX", "VALORANT", "FPS", "競技ゲーム"],
    joinedDate: "2021-03-15",
    isActive: true,
    color: "#00B4D8",
  },
  {
    id: "3",
    name: "一ノ瀬うるは",
    avatar: "https://yt3.googleusercontent.com/example3",
    memberType: "vspo_jp",
    description: "VSPO!所属。歌とゲームとお絵描きが好きです♪",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://youtube.com/@ichinose_uruha",
        handle: "@ichinose_uruha",
        subscriberCount: 320000,
      },
    ],
    stats: {
      totalClips: 750,
      totalViews: "1.2M",
      monthlyViewers: "95K",
      favoriteCount: 4800,
    },
    tags: ["歌ってみた", "お絵描き", "雑談", "マイクラ"],
    joinedDate: "2021-07-10",
    isActive: true,
    color: "#9D4EDD",
  },
  {
    id: "4",
    name: "胡桃のあ",
    avatar: "https://yt3.googleusercontent.com/example4",
    memberType: "vspo_jp",
    description: "VSPO!所属。ゲームと配信が大好きです！",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://youtube.com/@kurumi_noah",
        handle: "@kurumi_noah",
        subscriberCount: 280000,
      },
    ],
    stats: {
      totalClips: 650,
      totalViews: "980K",
      monthlyViewers: "78K",
      favoriteCount: 3900,
    },
    tags: ["ゲーム実況", "雑談", "ASMR"],
    joinedDate: "2021-12-05",
    isActive: true,
    color: "#F77F00",
  },
  {
    id: "5",
    name: "Zentreya",
    avatar: "https://yt3.googleusercontent.com/example5",
    memberType: "vspo_en",
    description: "VSPO! EN member. Variety gaming and just chatting streams.",
    platformLinks: [
      {
        platform: "twitch",
        url: "https://twitch.tv/zentreya",
        handle: "zentreya",
        subscriberCount: 520000,
      },
      {
        platform: "youtube",
        url: "https://youtube.com/@zentreya",
        handle: "@zentreya",
        subscriberCount: 180000,
      },
    ],
    stats: {
      totalClips: 890,
      totalViews: "1.5M",
      monthlyViewers: "120K",
      favoriteCount: 5500,
    },
    tags: ["Variety Gaming", "Just Chatting", "Mute Streamer"],
    joinedDate: "2022-08-20",
    isActive: true,
    color: "#7209B7",
  },
  {
    id: "6",
    name: "Jira Jisaki",
    avatar: "https://yt3.googleusercontent.com/example6",
    memberType: "vspo_en",
    description: "VSPO! EN member specializing in FPS games and music.",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://youtube.com/@jirajisaki",
        handle: "@jirajisaki",
        subscriberCount: 145000,
      },
      {
        platform: "twitch",
        url: "https://twitch.tv/jirajisaki",
        handle: "jirajisaki",
      },
    ],
    stats: {
      totalClips: 420,
      totalViews: "680K",
      monthlyViewers: "55K",
      favoriteCount: 2800,
    },
    tags: ["FPS", "Music", "Singing", "Gaming"],
    joinedDate: "2023-01-15",
    isActive: true,
    color: "#06FFA5",
  },
  {
    id: "7",
    name: "花芽風月",
    avatar: "https://yt3.googleusercontent.com/example7",
    memberType: "vspo_ch",
    description: "VSPO! CH成員，專精於遊戲實況和歌回。",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://youtube.com/@kanaga_fugetsu",
        handle: "@kanaga_fugetsu",
        subscriberCount: 95000,
      },
    ],
    stats: {
      totalClips: 340,
      totalViews: "520K",
      monthlyViewers: "42K",
      favoriteCount: 2100,
    },
    tags: ["遊戲實況", "歌回", "中文", "台灣"],
    joinedDate: "2023-06-01",
    isActive: true,
    color: "#FF4B3A",
  },
  {
    id: "8",
    name: "獨立VTuber",
    avatar: "https://yt3.googleusercontent.com/example8",
    memberType: "general",
    description: "個人勢のVTuberです。様々なゲームをプレイしています。",
    platformLinks: [
      {
        platform: "youtube",
        url: "https://youtube.com/@independent_vtuber",
        handle: "@independent_vtuber",
        subscriberCount: 25000,
      },
    ],
    stats: {
      totalClips: 120,
      totalViews: "180K",
      monthlyViewers: "15K",
      favoriteCount: 800,
    },
    tags: ["個人勢", "雑談", "レトロゲーム"],
    joinedDate: "2023-03-10",
    isActive: true,
    color: "#666666",
  },
];

class CreatorService extends BaseService {
  /**
   * Get all creators with filtering, sorting, and pagination
   */
  static async getCreators(
    filters?: CreatorFilters,
    sort?: CreatorSort,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Creator>> {
    await CreatorService.simulateNetworkDelay(200, 600);

    try {
      // Validate inputs
      const validatedPagination = validatePagination(pagination || {});
      const validatedFilters = CreatorFiltersSchema.parse(filters || {});
      const validatedSort = CreatorSortSchema.parse(sort || {});

      // Check cache
      const cacheKey = `creators_${JSON.stringify({ filters: validatedFilters, sort: validatedSort, pagination: validatedPagination })}`;
      const cached =
        CreatorService.getCache<PaginatedResponse<Creator>>(cacheKey);
      if (cached) {
        return { ...cached, meta: { ...cached.meta, cached: true } };
      }

      let filteredData = [...mockCreators];

      // Apply filters
      if (validatedFilters.memberType) {
        filteredData = filteredData.filter(
          (creator) => creator.memberType === validatedFilters.memberType,
        );
      }

      if (validatedFilters.isActive !== undefined) {
        filteredData = filteredData.filter(
          (creator) => creator.isActive === validatedFilters.isActive,
        );
      }

      if (validatedFilters.hasStats !== undefined) {
        filteredData = filteredData.filter(
          (creator) => !!creator.stats === validatedFilters.hasStats,
        );
      }

      if (validatedFilters.searchQuery) {
        filteredData = CreatorService.filterBySearch(
          filteredData,
          validatedFilters.searchQuery,
          ["name", "description", "tags"],
        );
      }

      if (validatedFilters.tags && validatedFilters.tags.length > 0) {
        filteredData = filteredData.filter((creator) =>
          validatedFilters.tags?.some((tag) => creator.tags?.includes(tag)),
        );
      }

      // Apply sorting
      filteredData = CreatorService.sortArray(filteredData, {
        field: validatedSort.field,
        direction: validatedSort.direction,
      });

      // Apply pagination
      const { items, total } = CreatorService.paginateArray(
        filteredData,
        validatedPagination,
      );
      const paginationMeta = CreatorService.calculatePagination(
        total,
        validatedPagination.page,
        validatedPagination.limit,
      );

      const response = CreatorService.createPaginatedResponse(
        items,
        paginationMeta,
      );

      // Cache the response
      CreatorService.setCache(cacheKey, response, 10); // Cache for 10 minutes

      return response;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to fetch creators: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get a single creator by ID
   */
  static async getCreatorById(id: string): Promise<ApiResponse<Creator>> {
    await CreatorService.simulateNetworkDelay(100, 300);

    try {
      const validatedId = validateId(id, "Creator");

      // Check cache
      const cacheKey = `creator_${validatedId}`;
      const cached = CreatorService.getCache<Creator>(cacheKey);
      if (cached) {
        return CreatorService.createResponse(cached, true);
      }

      const creator = mockCreators.find((c) => c.id === validatedId);
      if (!creator) {
        throw new NotFoundError("Creator", validatedId);
      }

      // Cache the response
      CreatorService.setCache(cacheKey, creator, 15); // Cache for 15 minutes

      return CreatorService.createResponse(creator);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to fetch creator: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get creators by member type
   */
  static async getCreatorsByMemberType(
    memberType: MemberType,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Creator>> {
    return CreatorService.getCreators({ memberType }, undefined, pagination);
  }

  /**
   * Search creators by query
   */
  static async searchCreators(
    query: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Creator>> {
    if (!query.trim()) {
      throw new ValidationError("Search query cannot be empty");
    }

    return CreatorService.getCreators(
      { searchQuery: query.trim() },
      undefined,
      pagination,
    );
  }

  /**
   * Get trending creators (most favorites)
   */
  static async getTrendingCreators(
    limit = 10,
  ): Promise<ApiResponse<Creator[]>> {
    await CreatorService.simulateNetworkDelay(150, 400);

    try {
      const cacheKey = `trending_creators_${limit}`;
      const cached = CreatorService.getCache<Creator[]>(cacheKey);
      if (cached) {
        return CreatorService.createResponse(cached, true);
      }

      const trending = [...mockCreators]
        .filter((creator) => creator.stats?.favoriteCount)
        .sort(
          (a, b) =>
            (b.stats?.favoriteCount || 0) - (a.stats?.favoriteCount || 0),
        )
        .slice(0, limit);

      // Cache the response
      CreatorService.setCache(cacheKey, trending, 5); // Cache for 5 minutes

      return CreatorService.createResponse(trending);
    } catch (error) {
      throw new Error(
        `Failed to fetch trending creators: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get creator statistics summary
   */
  static async getCreatorStats(): Promise<
    ApiResponse<{
      totalCreators: number;
      activeCreators: number;
      byMemberType: Record<MemberType, number>;
      totalClips: number;
      totalViews: string;
    }>
  > {
    await CreatorService.simulateNetworkDelay(100, 200);

    try {
      const cacheKey = "creator_stats";
      const cached = CreatorService.getCache(cacheKey);
      if (cached) {
        return CreatorService.createResponse(cached, true);
      }

      const stats = {
        totalCreators: mockCreators.length,
        activeCreators: mockCreators.filter((c) => c.isActive).length,
        byMemberType: {
          vspo_jp: mockCreators.filter((c) => c.memberType === "vspo_jp")
            .length,
          vspo_en: mockCreators.filter((c) => c.memberType === "vspo_en")
            .length,
          vspo_ch: mockCreators.filter((c) => c.memberType === "vspo_ch")
            .length,
          vspo_all: mockCreators.filter((c) => c.memberType === "vspo_all")
            .length,
          general: mockCreators.filter((c) => c.memberType === "general")
            .length,
        } as Record<MemberType, number>,
        totalClips: mockCreators.reduce(
          (sum, creator) => sum + (creator.stats?.totalClips || 0),
          0,
        ),
        totalViews: "8.9M", // Simplified for demo
      };

      // Cache for 30 minutes
      CreatorService.setCache(cacheKey, stats, 30);

      return CreatorService.createResponse(stats);
    } catch (error) {
      throw new Error(
        `Failed to fetch creator statistics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get available tags for filtering
   */
  static async getCreatorTags(): Promise<ApiResponse<string[]>> {
    await CreatorService.simulateNetworkDelay(50, 150);

    try {
      const cacheKey = "creator_tags";
      const cached = CreatorService.getCache<string[]>(cacheKey);
      if (cached) {
        return CreatorService.createResponse(cached, true);
      }

      const allTags = new Set<string>();
      mockCreators.forEach((creator) => {
        creator.tags?.forEach((tag) => allTags.add(tag));
      });

      const tags = Array.from(allTags).sort((a, b) => a.localeCompare(b, "ja"));

      // Cache for 60 minutes
      CreatorService.setCache(cacheKey, tags, 60);

      return CreatorService.createResponse(tags);
    } catch (error) {
      throw new Error(
        `Failed to fetch creator tags: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export default CreatorService;

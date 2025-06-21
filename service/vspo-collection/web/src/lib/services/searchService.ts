import { z } from "zod";
import { type Creator, CreatorSchema } from "../../common/types/creator";
import {
  type Clip,
  ClipSchema,
  type LiveWatchParty,
  LiveWatchPartySchema,
  type Playlist,
  PlaylistSchema,
} from "../../common/types/schemas";
import {
  type ApiResponse,
  BaseService,
  type PaginatedResponse,
  type PaginationParams,
  ValidationError,
  validatePagination,
} from "./base";

// Search-specific schemas
export const SearchFiltersSchema = z.object({
  query: z.string().min(1),
  type: z
    .enum(["all", "clips", "playlists", "creators", "watchparties"])
    .default("all"),
  category: z.string().optional(),
  language: z.enum(["ja", "en", "ko", "cn", "tw", "all"]).optional(),
  dateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
  minDuration: z.number().optional(), // For clips (in seconds)
  maxDuration: z.number().optional(), // For clips (in seconds)
  isLive: z.boolean().optional(), // For watch parties
  vtuber: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const SearchSortSchema = z.object({
  field: z
    .enum(["relevance", "date", "views", "likes", "duration", "alphabetical"])
    .default("relevance"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export const SearchResultSchema = z.object({
  id: z.string(),
  type: z.enum(["clip", "playlist", "creator", "watchparty"]),
  title: z.string(),
  description: z.string().optional(),
  thumbnail: z.string(),
  url: z.string().optional(),
  relevanceScore: z.number(),
  matchedFields: z.array(z.string()),
  highlightedTitle: z.string().optional(),
  highlightedDescription: z.string().optional(),
  metadata: z.record(z.string(), z.any()),
});

export const SearchSuggestionsSchema = z.object({
  query: z.string(),
  suggestions: z.array(
    z.object({
      text: z.string(),
      type: z.enum(["query", "vtuber", "category", "tag"]),
      count: z.number().optional(),
    }),
  ),
});

export const AutoCompleteSchema = z.object({
  query: z.string(),
  completions: z.array(
    z.object({
      text: z.string(),
      type: z.enum(["recent", "popular", "suggestion"]),
      metadata: z.record(z.string(), z.any()).optional(),
    }),
  ),
});

// Inferred types
export type SearchFilters = z.infer<typeof SearchFiltersSchema>;
export type SearchSort = z.infer<typeof SearchSortSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchSuggestions = z.infer<typeof SearchSuggestionsSchema>;
export type AutoComplete = z.infer<typeof AutoCompleteSchema>;

// Import mock data from other services (simplified for this example)
const mockClips = [
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
    createdAt: "2024-01-15T10:30:00Z",
    tags: ["APEX", "クラッチ", "神プレイ", "FPS"],
    description: "橘ひなのちゃんのAPEXで見せた奇跡の1vs3クラッチシーン！",
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
    createdAt: "2024-01-14T19:45:00Z",
    tags: ["歌ってみた", "シャルル", "感動", "ボカロ"],
    description: "エマちゃんのシャルルが本当に美しい...",
  },
];

const mockPlaylists = [
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
    description: "VSPO!メンバーの神がかったゲーミング瞬間を厳選！",
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
    description: "心と体を癒すASMR配信の決定版。",
  },
];

const mockCreators = [
  {
    id: "1",
    name: "橘ひなの",
    avatar: "https://yt3.googleusercontent.com/example1",
    memberType: "vspo_jp",
    description: "VSPO!所属のゲーム好きVTuber。FPSとホラーゲームが得意です！",
    tags: ["FPS", "ホラー", "ゲーム実況", "歌ってみた"],
  },
  {
    id: "2",
    name: "藍沢エマ",
    avatar: "https://yt3.googleusercontent.com/example2",
    memberType: "vspo_jp",
    description: "VSPO!所属。APEXとVALORANTをメインにプレイしています。",
    tags: ["APEX", "VALORANT", "FPS", "競技ゲーム"],
  },
];

const mockWatchParties = [
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
    tags: ["APEX", "ランクマッチ", "FPS"],
    description: "ひなのちゃんのランクマッチを皆で応援しながら見ましょう！",
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
    tags: ["歌枠", "歌ってみた", "ボカロ"],
    description: "エマちゃんの歌枠を聴きながら歌詞を一緒に覚えませんか？",
  },
];

// Popular searches and suggestions
const popularSearches = [
  "橘ひなの APEX",
  "藍沢エマ 歌ってみた",
  "VSPO コラボ",
  "一ノ瀬うるは ASMR",
  "胡桃のあ お絵描き",
  "FPS クリップ",
  "歌枠",
  "ホラーゲーム",
  "雑談配信",
  "マイクラ",
];

const recentSearches = [
  "シャルル 歌ってみた",
  "APEX クラッチ",
  "コラボ配信",
  "癒やし ASMR",
  "ゲーム実況",
];

class SearchService extends BaseService {
  /**
   * Perform unified search across all content types
   */
  static async search(
    filters: SearchFilters,
    sort?: SearchSort,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<SearchResult>> {
    await SearchService.simulateNetworkDelay(300, 800);

    try {
      const validatedFilters = SearchFiltersSchema.parse(filters);
      const validatedSort = SearchSortSchema.parse(sort || {});
      const validatedPagination = validatePagination(pagination || {});

      const cacheKey = `search_${JSON.stringify({ filters: validatedFilters, sort: validatedSort, pagination: validatedPagination })}`;
      const cached =
        SearchService.getCache<PaginatedResponse<SearchResult>>(cacheKey);
      if (cached) {
        return { ...cached, meta: { ...cached.meta, cached: true } };
      }

      const searchResults: SearchResult[] = [];
      const query = validatedFilters.query.toLowerCase();

      // Search clips
      if (
        validatedFilters.type === "all" ||
        validatedFilters.type === "clips"
      ) {
        mockClips.forEach((clip) => {
          const relevanceScore = SearchService.calculateRelevanceScore(query, [
            clip.title,
            clip.description || "",
            clip.vtuber,
            ...clip.tags,
          ]);

          if (relevanceScore > 0) {
            searchResults.push({
              id: `clip_${clip.id}`,
              type: "clip",
              title: clip.title,
              description: clip.description,
              thumbnail: clip.thumbnail,
              url: `/clips/${clip.id}`,
              relevanceScore,
              matchedFields: SearchService.getMatchedFields(query, {
                title: clip.title,
                description: clip.description || "",
                vtuber: clip.vtuber,
                tags: clip.tags,
              }),
              highlightedTitle: SearchService.highlightText(clip.title, query),
              highlightedDescription: SearchService.highlightText(
                clip.description || "",
                query,
              ),
              metadata: {
                type: "clip",
                vtuber: clip.vtuber,
                duration: clip.duration,
                views: clip.views,
                likes: clip.likes,
                category: clip.category,
                tags: clip.tags,
                createdAt: clip.createdAt,
              },
            });
          }
        });
      }

      // Search playlists
      if (
        validatedFilters.type === "all" ||
        validatedFilters.type === "playlists"
      ) {
        mockPlaylists.forEach((playlist) => {
          const relevanceScore = SearchService.calculateRelevanceScore(query, [
            playlist.title,
            playlist.description || "",
            playlist.creator,
            ...playlist.tags,
          ]);

          if (relevanceScore > 0) {
            searchResults.push({
              id: `playlist_${playlist.id}`,
              type: "playlist",
              title: playlist.title,
              description: playlist.description,
              thumbnail: playlist.thumbnail,
              url: `/playlists/${playlist.id}`,
              relevanceScore,
              matchedFields: SearchService.getMatchedFields(query, {
                title: playlist.title,
                description: playlist.description || "",
                creator: playlist.creator,
                tags: playlist.tags,
              }),
              highlightedTitle: SearchService.highlightText(
                playlist.title,
                query,
              ),
              highlightedDescription: SearchService.highlightText(
                playlist.description || "",
                query,
              ),
              metadata: {
                type: "playlist",
                creator: playlist.creator,
                videoCount: playlist.videoCount,
                views: playlist.views,
                likes: playlist.likes,
                category: playlist.category,
                tags: playlist.tags,
                isHot: playlist.isHot,
              },
            });
          }
        });
      }

      // Search creators
      if (
        validatedFilters.type === "all" ||
        validatedFilters.type === "creators"
      ) {
        mockCreators.forEach((creator) => {
          const relevanceScore = SearchService.calculateRelevanceScore(query, [
            creator.name,
            creator.description || "",
            ...creator.tags,
          ]);

          if (relevanceScore > 0) {
            searchResults.push({
              id: `creator_${creator.id}`,
              type: "creator",
              title: creator.name,
              description: creator.description,
              thumbnail: creator.avatar,
              url: `/vtubers/${creator.id}`,
              relevanceScore,
              matchedFields: SearchService.getMatchedFields(query, {
                name: creator.name,
                description: creator.description || "",
                tags: creator.tags,
              }),
              highlightedTitle: SearchService.highlightText(
                creator.name,
                query,
              ),
              highlightedDescription: SearchService.highlightText(
                creator.description || "",
                query,
              ),
              metadata: {
                type: "creator",
                memberType: creator.memberType,
                tags: creator.tags,
              },
            });
          }
        });
      }

      // Search watch parties
      if (
        validatedFilters.type === "all" ||
        validatedFilters.type === "watchparties"
      ) {
        mockWatchParties.forEach((party) => {
          const relevanceScore = SearchService.calculateRelevanceScore(query, [
            party.title,
            party.description || "",
            party.vtuber,
            party.hostUser,
            ...party.tags,
          ]);

          if (relevanceScore > 0) {
            searchResults.push({
              id: `watchparty_${party.id}`,
              type: "watchparty",
              title: party.title,
              description: party.description,
              thumbnail: party.thumbnail,
              url: `/watch-party/${party.id}`,
              relevanceScore,
              matchedFields: SearchService.getMatchedFields(query, {
                title: party.title,
                description: party.description || "",
                vtuber: party.vtuber,
                hostUser: party.hostUser,
                tags: party.tags,
              }),
              highlightedTitle: SearchService.highlightText(party.title, query),
              highlightedDescription: SearchService.highlightText(
                party.description || "",
                query,
              ),
              metadata: {
                type: "watchparty",
                vtuber: party.vtuber,
                viewers: party.viewers,
                status: party.status,
                category: party.category,
                tags: party.tags,
                isPopular: party.isPopular,
                startTime: party.startTime,
              },
            });
          }
        });
      }

      // Apply additional filters
      let filteredResults = searchResults;

      if (validatedFilters.category) {
        filteredResults = filteredResults.filter(
          (result) => result.metadata.category === validatedFilters.category,
        );
      }

      if (validatedFilters.language && validatedFilters.language !== "all") {
        filteredResults = filteredResults.filter(
          (result) => result.metadata.language === validatedFilters.language,
        );
      }

      if (validatedFilters.vtuber) {
        filteredResults = filteredResults.filter((result) =>
          result.metadata.vtuber
            ?.toLowerCase()
            .includes(validatedFilters.vtuber?.toLowerCase()),
        );
      }

      if (validatedFilters.isLive !== undefined) {
        filteredResults = filteredResults.filter(
          (result) =>
            result.type === "watchparty" &&
            (result.metadata.status === "LIVE") === validatedFilters.isLive,
        );
      }

      // Apply sorting
      if (validatedSort.field === "relevance") {
        filteredResults.sort((a, b) =>
          validatedSort.direction === "desc"
            ? b.relevanceScore - a.relevanceScore
            : a.relevanceScore - b.relevanceScore,
        );
      } else if (validatedSort.field === "alphabetical") {
        filteredResults.sort((a, b) =>
          validatedSort.direction === "desc"
            ? b.title.localeCompare(a.title, "ja")
            : a.title.localeCompare(b.title, "ja"),
        );
      } else {
        // For other fields, sort by metadata if available
        filteredResults.sort((a, b) => {
          const aValue = a.metadata[validatedSort.field] || 0;
          const bValue = b.metadata[validatedSort.field] || 0;

          if (typeof aValue === "string" && typeof bValue === "string") {
            return validatedSort.direction === "desc"
              ? bValue.localeCompare(aValue)
              : aValue.localeCompare(bValue);
          }

          const aNum = typeof aValue === "number" ? aValue : 0;
          const bNum = typeof bValue === "number" ? bValue : 0;
          return validatedSort.direction === "desc" ? bNum - aNum : aNum - bNum;
        });
      }

      // Apply pagination
      const { items, total } = SearchService.paginateArray(
        filteredResults,
        validatedPagination,
      );
      const paginationMeta = SearchService.calculatePagination(
        total,
        validatedPagination.page,
        validatedPagination.limit,
      );

      const response = SearchService.createPaginatedResponse(
        items,
        paginationMeta,
      );
      SearchService.setCache(cacheKey, response, 5); // Cache for 5 minutes

      return response;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get search suggestions based on query
   */
  static async getSearchSuggestions(
    query: string,
  ): Promise<ApiResponse<SearchSuggestions>> {
    await SearchService.simulateNetworkDelay(100, 300);

    try {
      if (!query.trim()) {
        throw new ValidationError("Query cannot be empty");
      }

      const cacheKey = `suggestions_${query.toLowerCase()}`;
      const cached = SearchService.getCache<SearchSuggestions>(cacheKey);
      if (cached) {
        return SearchService.createResponse(cached, true);
      }

      const normalizedQuery = query.toLowerCase();
      const suggestions: SearchSuggestions["suggestions"] = [];

      // Add VTuber suggestions
      mockCreators.forEach((creator) => {
        if (creator.name.toLowerCase().includes(normalizedQuery)) {
          suggestions.push({
            text: creator.name,
            type: "vtuber",
            count: Math.floor(Math.random() * 1000) + 100, // Mock count
          });
        }
      });

      // Add tag suggestions
      const allTags = new Set<string>();
      [...mockClips, ...mockPlaylists, ...mockWatchParties].forEach((item) => {
        item.tags.forEach((tag) => {
          if (tag.toLowerCase().includes(normalizedQuery)) {
            allTags.add(tag);
          }
        });
      });

      Array.from(allTags).forEach((tag) => {
        suggestions.push({
          text: tag,
          type: "tag",
          count: Math.floor(Math.random() * 500) + 50,
        });
      });

      // Add query suggestions from popular searches
      popularSearches.forEach((search) => {
        if (search.toLowerCase().includes(normalizedQuery)) {
          suggestions.push({
            text: search,
            type: "query",
            count: Math.floor(Math.random() * 2000) + 200,
          });
        }
      });

      // Sort by relevance and limit
      const sortedSuggestions = suggestions
        .sort((a, b) => (b.count || 0) - (a.count || 0))
        .slice(0, 10);

      const searchSuggestions: SearchSuggestions = {
        query,
        suggestions: sortedSuggestions,
      };

      SearchService.setCache(cacheKey, searchSuggestions, 30); // Cache for 30 minutes
      return SearchService.createResponse(searchSuggestions);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to get search suggestions: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get autocomplete suggestions
   */
  static async getAutoComplete(
    query: string,
  ): Promise<ApiResponse<AutoComplete>> {
    await SearchService.simulateNetworkDelay(50, 200);

    try {
      const cacheKey = `autocomplete_${query.toLowerCase()}`;
      const cached = SearchService.getCache<AutoComplete>(cacheKey);
      if (cached) {
        return SearchService.createResponse(cached, true);
      }

      const normalizedQuery = query.toLowerCase();
      const completions: AutoComplete["completions"] = [];

      // Add recent searches that match
      recentSearches.forEach((search) => {
        if (search.toLowerCase().startsWith(normalizedQuery)) {
          completions.push({
            text: search,
            type: "recent",
            metadata: { lastUsed: "2024-01-16T15:30:00Z" },
          });
        }
      });

      // Add popular searches that match
      popularSearches.forEach((search) => {
        if (search.toLowerCase().startsWith(normalizedQuery)) {
          completions.push({
            text: search,
            type: "popular",
            metadata: { searchCount: Math.floor(Math.random() * 10000) + 1000 },
          });
        }
      });

      // Add creator names that match
      mockCreators.forEach((creator) => {
        if (creator.name.toLowerCase().startsWith(normalizedQuery)) {
          completions.push({
            text: creator.name,
            type: "suggestion",
            metadata: { type: "creator", memberType: creator.memberType },
          });
        }
      });

      // Remove duplicates and limit
      const uniqueCompletions = completions
        .filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.text === item.text),
        )
        .slice(0, 8);

      const autoComplete: AutoComplete = {
        query,
        completions: uniqueCompletions,
      };

      SearchService.setCache(cacheKey, autoComplete, 15); // Cache for 15 minutes
      return SearchService.createResponse(autoComplete);
    } catch (error) {
      throw new Error(
        `Failed to get autocomplete: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get popular searches
   */
  static async getPopularSearches(limit = 10): Promise<ApiResponse<string[]>> {
    await SearchService.simulateNetworkDelay(50, 150);

    try {
      const cacheKey = `popular_searches_${limit}`;
      const cached = SearchService.getCache<string[]>(cacheKey);
      if (cached) {
        return SearchService.createResponse(cached, true);
      }

      const popular = popularSearches.slice(0, limit);
      SearchService.setCache(cacheKey, popular, 60); // Cache for 1 hour
      return SearchService.createResponse(popular);
    } catch (error) {
      throw new Error(
        `Failed to get popular searches: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get recent searches (user-specific)
   */
  static async getRecentSearches(limit = 5): Promise<ApiResponse<string[]>> {
    await SearchService.simulateNetworkDelay(50, 150);

    try {
      // In a real app, this would be user-specific
      const recent = recentSearches.slice(0, limit);
      return SearchService.createResponse(recent);
    } catch (error) {
      throw new Error(
        `Failed to get recent searches: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Save search query (mock operation)
   */
  static async saveSearchQuery(
    query: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    await SearchService.simulateNetworkDelay(100, 200);

    try {
      if (!query.trim()) {
        throw new ValidationError("Query cannot be empty");
      }

      // Simulate saving to recent searches
      const index = recentSearches.indexOf(query);
      if (index > -1) {
        recentSearches.splice(index, 1);
      }
      recentSearches.unshift(query);
      recentSearches.splice(10); // Keep only 10 recent searches

      // Clear autocomplete cache for this query
      SearchService.clearCache(`autocomplete_${query.toLowerCase()}`);

      return SearchService.createResponse({ success: true });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to save search query: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Calculate relevance score for search results
   */
  private static calculateRelevanceScore(
    query: string,
    searchableFields: string[],
  ): number {
    const normalizedQuery = query.toLowerCase();
    let score = 0;

    searchableFields.forEach((field, index) => {
      const normalizedField = field.toLowerCase();

      // Exact match gets highest score
      if (normalizedField === normalizedQuery) {
        score += 100;
      }
      // Field starts with query gets high score
      else if (normalizedField.startsWith(normalizedQuery)) {
        score += 80;
      }
      // Field contains query gets medium score
      else if (normalizedField.includes(normalizedQuery)) {
        score += 50;
      }
      // Check individual words
      else {
        const queryWords = normalizedQuery.split(" ");
        const fieldWords = normalizedField.split(" ");

        queryWords.forEach((qWord) => {
          fieldWords.forEach((fWord) => {
            if (fWord.includes(qWord) && qWord.length > 2) {
              score += 10;
            }
          });
        });
      }

      // Weight by field importance (title > description > other fields)
      const weight = index === 0 ? 1.5 : index === 1 ? 1.2 : 1.0;
      score *= weight;
    });

    return Math.round(score);
  }

  /**
   * Get matched fields for highlighting
   */
  private static getMatchedFields(
    query: string,
    fields: Record<string, string | string[]>,
  ): string[] {
    const normalizedQuery = query.toLowerCase();
    const matchedFields: string[] = [];

    Object.entries(fields).forEach(([fieldName, fieldValue]) => {
      const searchText = Array.isArray(fieldValue)
        ? fieldValue.join(" ").toLowerCase()
        : fieldValue.toLowerCase();

      if (searchText.includes(normalizedQuery)) {
        matchedFields.push(fieldName);
      }
    });

    return matchedFields;
  }

  /**
   * Highlight search terms in text
   */
  private static highlightText(text: string, query: string): string {
    if (!text || !query) return text;

    const normalizedQuery = query.toLowerCase();
    const regex = new RegExp(`(${normalizedQuery})`, "gi");

    return text.replace(regex, "<mark>$1</mark>");
  }

  /**
   * Get search analytics
   */
  static async getSearchAnalytics(): Promise<
    ApiResponse<{
      totalSearches: number;
      uniqueQueries: number;
      topQueries: Array<{ query: string; count: number }>;
      searchesByType: Record<string, number>;
      averageResultsPerSearch: number;
      noResultsRate: number;
    }>
  > {
    await SearchService.simulateNetworkDelay(200, 500);

    try {
      const cacheKey = "search_analytics";
      const cached = SearchService.getCache(cacheKey);
      if (cached) {
        return SearchService.createResponse(cached, true);
      }

      // Mock analytics data
      const analytics = {
        totalSearches: 15420,
        uniqueQueries: 8765,
        topQueries: [
          { query: "橘ひなの APEX", count: 1234 },
          { query: "藍沢エマ 歌ってみた", count: 987 },
          { query: "VSPO コラボ", count: 876 },
          { query: "一ノ瀬うるは ASMR", count: 654 },
          { query: "FPS クリップ", count: 543 },
        ],
        searchesByType: {
          all: 8234,
          clips: 3456,
          playlists: 2123,
          creators: 1234,
          watchparties: 373,
        },
        averageResultsPerSearch: 12.4,
        noResultsRate: 0.08, // 8%
      };

      SearchService.setCache(cacheKey, analytics, 120); // Cache for 2 hours
      return SearchService.createResponse(analytics);
    } catch (error) {
      throw new Error(
        `Failed to get search analytics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export default SearchService;

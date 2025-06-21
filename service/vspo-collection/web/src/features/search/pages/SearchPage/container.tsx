"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  PopularSearch,
  RecentSearch,
  SearchContentType,
  SearchDateRange,
  SearchFilters,
  SearchPlatform,
  SearchResults,
  SearchSortBy,
  SearchState,
  SearchSuggestion,
  SearchableClip,
  SearchablePlaylist,
  SearchableVTuber,
  SearchableWatchParty,
} from "../../types";
import { SearchPagePresenter } from "./presenter";

// Generate comprehensive mock data
const generateMockVTubers = (): SearchableVTuber[] => {
  const vtubers = [
    {
      id: "1",
      name: "🦄 花音かなで",
      avatar: "/placeholder.svg?height=80&width=80&text=かなで",
      memberType: "vspo_jp" as const,
      description: "ゲーマー系VTuber。FPSが得意で、明るい性格が人気。",
      platformLinks: [
        {
          platform: "youtube" as const,
          url: "https://youtube.com/@kanade",
          handle: "@kanade",
          subscriberCount: 450000,
        },
        {
          platform: "twitch" as const,
          url: "https://twitch.tv/kanade",
          handle: "kanade",
          subscriberCount: 120000,
        },
      ],
      stats: {
        totalClips: 1250,
        totalViews: "15.2M",
        monthlyViewers: "2.1M",
        favoriteCount: 8900,
      },
      tags: ["FPS", "ゲーム", "歌枠", "雑談"],
      joinedDate: "2022-03-15",
      isActive: true,
      color: "#FF006E",
      totalClips: 1250,
      totalViews: "15.2M",
      isLive: true,
      lastActive: new Date().toISOString(),
    },
    {
      id: "2",
      name: "🌺 桜咲ひまり",
      avatar: "/placeholder.svg?height=80&width=80&text=ひまり",
      memberType: "vspo_jp" as const,
      description: "歌が上手なVTuber。ASMR配信も人気。",
      platformLinks: [
        {
          platform: "youtube" as const,
          url: "https://youtube.com/@himari",
          handle: "@himari",
          subscriberCount: 380000,
        },
      ],
      stats: {
        totalClips: 890,
        totalViews: "12.8M",
        monthlyViewers: "1.8M",
        favoriteCount: 7200,
      },
      tags: ["歌枠", "ASMR", "雑談", "お絵描き"],
      joinedDate: "2022-01-20",
      isActive: true,
      color: "#FF4B3A",
      totalClips: 890,
      totalViews: "12.8M",
      isLive: false,
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      name: "🌸 春野さくら",
      avatar: "/placeholder.svg?height=80&width=80&text=さくら",
      memberType: "vspo_en" as const,
      description:
        "English VTuber specializing in variety games and chatting streams.",
      platformLinks: [
        {
          platform: "youtube" as const,
          url: "https://youtube.com/@sakura",
          handle: "@sakura",
          subscriberCount: 290000,
        },
        {
          platform: "twitch" as const,
          url: "https://twitch.tv/sakura",
          handle: "sakura",
          subscriberCount: 85000,
        },
      ],
      stats: {
        totalClips: 670,
        totalViews: "8.9M",
        monthlyViewers: "1.2M",
        favoriteCount: 5400,
      },
      tags: ["EN", "Variety", "Chat", "Art"],
      joinedDate: "2022-06-10",
      isActive: true,
      color: "#00B4D8",
      totalClips: 670,
      totalViews: "8.9M",
      isLive: false,
      lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return vtubers;
};

const generateMockClips = (): SearchableClip[] => {
  const platforms: SearchPlatform[] = [
    "youtube",
    "twitch",
    "twitcasting",
    "niconico",
  ];
  const categories = [
    "Gaming",
    "Music",
    "ASMR",
    "Chat",
    "Art",
    "Cooking",
    "Collab",
  ];
  const vtuberNames = [
    "🦄 花音かなで",
    "🌺 桜咲ひまり",
    "🌸 春野さくら",
    "🎨 藍川あやね",
    "🌙 月夜るな",
  ];

  const clips: SearchableClip[] = [];

  for (let i = 1; i <= 100; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const vtuber = vtuberNames[Math.floor(Math.random() * vtuberNames.length)];
    const viewCount = Math.floor(Math.random() * 1000000) + 10000;

    clips.push({
      id: i,
      title: `【${category}】${generateRandomTitle(category)} #${i}`,
      vtuber,
      thumbnail: `/placeholder.svg?height=180&width=320&text=Clip${i}`,
      duration: `${Math.floor(Math.random() * 20) + 1}:${Math.floor(
        Math.random() * 60,
      )
        .toString()
        .padStart(2, "0")}`,
      views: formatViewCount(viewCount),
      clipper: `切り抜き師${Math.floor(Math.random() * 20) + 1}`,
      isExclusive: Math.random() > 0.8,
      likes: Math.floor(viewCount * 0.05),
      comments: Math.floor(viewCount * 0.02),
      watchPartyActive: Math.random() > 0.9,
      platform,
      uploadedAt: new Date(
        Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      ).toISOString(),
      tags: generateRandomTags(category),
      category,
      transcript: `This is a sample transcript for ${category} content...`,
    });
  }

  return clips;
};

const generateMockPlaylists = (): SearchablePlaylist[] => {
  const categories = [
    "Gaming",
    "Music",
    "ASMR",
    "Collab",
    "Best Moments",
    "Weekly Highlights",
  ];
  const creators = [
    "プレイリストマスター",
    "切り抜きコレクター",
    "ファンのまとめ",
    "神回アーカイブ",
  ];

  const playlists: SearchablePlaylist[] = [];

  for (let i = 1; i <= 50; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const creator = creators[Math.floor(Math.random() * creators.length)];
    const videoCount = Math.floor(Math.random() * 50) + 5;
    const views = Math.floor(Math.random() * 500000) + 10000;

    playlists.push({
      id: i,
      title: `${category}厳選まとめ Vol.${i}`,
      creator,
      creatorBadge: Math.random() > 0.7 ? "⭐" : "",
      thumbnail: `/placeholder.svg?height=180&width=320&text=Playlist${i}`,
      videoCount,
      views: formatViewCount(views),
      topVideo: `人気動画 #${i}`,
      isHot: Math.random() > 0.8,
      likes: Math.floor(views * 0.03),
      watchPartyCount: Math.floor(Math.random() * 5),
      tags: [category, "まとめ", "厳選"],
      description: `${category}の名場面を厳選したプレイリストです。全${videoCount}本の動画で構成されています。`,
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000),
      ).toISOString(),
      updatedAt: new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      ).toISOString(),
      totalDuration: `${Math.floor(Math.random() * 5) + 1}:${Math.floor(
        Math.random() * 60,
      )
        .toString()
        .padStart(2, "0")}:${Math.floor(Math.random() * 60)
        .toString()
        .padStart(2, "0")}`,
      category,
      isPublic: Math.random() > 0.1,
    });
  }

  return playlists;
};

const generateMockWatchParties = (): SearchableWatchParty[] => {
  const statuses: ("live" | "scheduled" | "ended")[] = [
    "live",
    "scheduled",
    "ended",
  ];
  const contentTypes: ("clip" | "playlist" | "live")[] = [
    "clip",
    "playlist",
    "live",
  ];
  const hosts = ["パーティーホスト1", "みんなで見よう", "深夜組集合", "朝活組"];

  const watchParties: SearchableWatchParty[] = [];

  for (let i = 1; i <= 30; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const contentType =
      contentTypes[Math.floor(Math.random() * contentTypes.length)];
    const host = hosts[Math.floor(Math.random() * hosts.length)];
    const viewers = Math.floor(Math.random() * 200) + 5;

    watchParties.push({
      id: i,
      title: `【ウォッチパーティー】みんなで一緒に見よう #${i}`,
      description: `${contentType}を一緒に楽しむウォッチパーティーです。コメントで盛り上がりましょう！`,
      hostUser: host,
      hostAvatar: `/placeholder.svg?height=40&width=40&text=Host${i}`,
      thumbnail: `/placeholder.svg?height=180&width=320&text=Party${i}`,
      viewers,
      maxViewers: viewers + Math.floor(Math.random() * 50),
      status,
      startTime:
        status === "scheduled"
          ? new Date(
              Date.now() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
            ).toISOString()
          : new Date(
              Date.now() - Math.floor(Math.random() * 2 * 60 * 60 * 1000),
            ).toISOString(),
      endTime:
        status === "ended"
          ? new Date(
              Date.now() - Math.floor(Math.random() * 60 * 60 * 1000),
            ).toISOString()
          : undefined,
      contentType,
      contentId: Math.floor(Math.random() * 100) + 1,
      tags: ["ウォッチパーティー", contentType, status],
      isPublic: Math.random() > 0.2,
      roomCode: `PARTY${i.toString().padStart(3, "0")}`,
    });
  }

  return watchParties;
};

// Helper functions
const generateRandomTitle = (category: string): string => {
  const titles = {
    Gaming: [
      "神プレイ連発",
      "まさかの大逆転",
      "爆笑ゲーム実況",
      "初見プレイの反応",
    ],
    Music: [
      "歌ってみた神回",
      "美声に癒される",
      "リクエスト歌枠",
      "アカペラ披露",
    ],
    ASMR: ["癒やしボイス", "耳元でささやき", "安眠確定", "リラックスタイム"],
    Chat: [
      "雑談で本音炸裂",
      "視聴者との交流",
      "深夜のまったり",
      "質問コーナー",
    ],
    Art: ["お絵描き配信", "神絵師プロセス", "視聴者リクエスト", "アート解説"],
    Cooking: ["料理配信", "失敗からの成功", "レシピ紹介", "食レポ"],
    Collab: ["コラボ配信", "メンバー同士の絡み", "企画もの", "ゲーム対戦"],
  };

  const categoryTitles =
    titles[category as keyof typeof titles] || titles.Gaming;
  return categoryTitles[Math.floor(Math.random() * categoryTitles.length)];
};

const generateRandomTags = (category: string): string[] => {
  const baseTags = [category];
  const additionalTags = [
    "切り抜き",
    "面白い",
    "神回",
    "必見",
    "感動",
    "爆笑",
    "てぇてぇ",
  ];

  const numTags = Math.floor(Math.random() * 3) + 2;
  const shuffled = additionalTags.sort(() => 0.5 - Math.random());

  return [...baseTags, ...shuffled.slice(0, numTags - 1)];
};

const formatViewCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${Math.floor(count / 1000)}K`;
  }
  return count.toString();
};

// Mock suggestions data
const mockSuggestions: SearchSuggestion[] = [
  { id: "1", text: "花音かなで", type: "vtuber", popularity: 95, icon: "🦄" },
  { id: "2", text: "歌枠", type: "tag", popularity: 88 },
  { id: "3", text: "FPS", type: "tag", popularity: 82 },
  { id: "4", text: "ASMR", type: "category", popularity: 79 },
  { id: "5", text: "コラボ", type: "category", popularity: 76 },
  { id: "6", text: "桜咲ひまり", type: "vtuber", popularity: 73, icon: "🌺" },
  { id: "7", text: "ゲーム実況", type: "query", popularity: 70 },
  { id: "8", text: "雑談", type: "tag", popularity: 68 },
];

const mockRecentSearches: RecentSearch[] = [
  {
    id: "1",
    query: "花音かなで FPS",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    resultCount: 156,
  },
  {
    id: "2",
    query: "歌枠",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    resultCount: 89,
  },
  {
    id: "3",
    query: "コラボ配信",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resultCount: 234,
  },
];

const mockPopularSearches: PopularSearch[] = [
  {
    id: "1",
    query: "歌枠",
    searchCount: 15420,
    trend: "up",
    category: "Music",
  },
  {
    id: "2",
    query: "FPS",
    searchCount: 12890,
    trend: "stable",
    category: "Gaming",
  },
  { id: "3", query: "ASMR", searchCount: 11200, trend: "up", category: "ASMR" },
  {
    id: "4",
    query: "コラボ",
    searchCount: 9876,
    trend: "down",
    category: "Collab",
  },
  {
    id: "5",
    query: "雑談",
    searchCount: 8654,
    trend: "stable",
    category: "Chat",
  },
];

export const SearchPageContainer = () => {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  // Mock data
  const [allVTubers] = useState<SearchableVTuber[]>(generateMockVTubers());
  const [allClips] = useState<SearchableClip[]>(generateMockClips());
  const [allPlaylists] = useState<SearchablePlaylist[]>(
    generateMockPlaylists(),
  );
  const [allWatchParties] = useState<SearchableWatchParty[]>(
    generateMockWatchParties(),
  );

  // Search state
  const [searchState, setSearchState] = useState<SearchState>({
    query: initialQuery,
    filters: {
      contentType: "all",
      platform: "all",
      dateRange: "all",
      sortBy: "relevance",
      query: initialQuery,
    },
    results: null,
    suggestions: mockSuggestions,
    recentSearches: mockRecentSearches,
    popularSearches: mockPopularSearches,
    isLoading: false,
    isLoadingSuggestions: false,
    error: null,
    hasSearched: !!initialQuery,
    showAdvancedFilters: false,
  });

  // Search function
  const performSearch = useCallback(
    (query: string, filters: SearchFilters) => {
      if (!query.trim()) {
        setSearchState((prev) => ({
          ...prev,
          results: null,
          hasSearched: false,
          error: null,
        }));
        return;
      }

      setSearchState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Simulate API delay
      setTimeout(() => {
        const searchStartTime = Date.now();
        const lowerQuery = query.toLowerCase();

        // Filter VTubers
        let filteredVTubers = allVTubers.filter(
          (vtuber) =>
            vtuber.name.toLowerCase().includes(lowerQuery) ||
            vtuber.description?.toLowerCase().includes(lowerQuery) ||
            vtuber.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
        );

        // Filter Clips
        let filteredClips = allClips.filter(
          (clip) =>
            clip.title.toLowerCase().includes(lowerQuery) ||
            clip.vtuber.toLowerCase().includes(lowerQuery) ||
            clip.clipper.toLowerCase().includes(lowerQuery) ||
            clip.category.toLowerCase().includes(lowerQuery) ||
            clip.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
        );

        // Filter Playlists
        let filteredPlaylists = allPlaylists.filter(
          (playlist) =>
            playlist.title.toLowerCase().includes(lowerQuery) ||
            playlist.creator.toLowerCase().includes(lowerQuery) ||
            playlist.description.toLowerCase().includes(lowerQuery) ||
            playlist.category.toLowerCase().includes(lowerQuery) ||
            playlist.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
        );

        // Filter Watch Parties
        let filteredWatchParties = allWatchParties.filter(
          (party) =>
            party.title.toLowerCase().includes(lowerQuery) ||
            party.description.toLowerCase().includes(lowerQuery) ||
            party.hostUser.toLowerCase().includes(lowerQuery) ||
            party.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
        );

        // Apply content type filter
        if (filters.contentType !== "all") {
          switch (filters.contentType) {
            case "vtubers":
              filteredClips = [];
              filteredPlaylists = [];
              filteredWatchParties = [];
              break;
            case "clips":
              filteredVTubers = [];
              filteredPlaylists = [];
              filteredWatchParties = [];
              break;
            case "playlists":
              filteredVTubers = [];
              filteredClips = [];
              filteredWatchParties = [];
              break;
            case "watchparties":
              filteredVTubers = [];
              filteredClips = [];
              filteredPlaylists = [];
              break;
          }
        }

        // Apply platform filter
        if (filters.platform !== "all") {
          filteredClips = filteredClips.filter(
            (clip) => clip.platform === filters.platform,
          );
          filteredVTubers = filteredVTubers.filter((vtuber) =>
            vtuber.platformLinks.some(
              (link) => link.platform === filters.platform,
            ),
          );
        }

        // Apply date range filter
        if (filters.dateRange !== "all") {
          const now = Date.now();
          const getTimeThreshold = (range: SearchDateRange) => {
            switch (range) {
              case "day":
                return now - 24 * 60 * 60 * 1000;
              case "week":
                return now - 7 * 24 * 60 * 60 * 1000;
              case "month":
                return now - 30 * 24 * 60 * 60 * 1000;
              case "year":
                return now - 365 * 24 * 60 * 60 * 1000;
              default:
                return 0;
            }
          };

          const threshold = getTimeThreshold(filters.dateRange);
          filteredClips = filteredClips.filter(
            (clip) => new Date(clip.uploadedAt).getTime() >= threshold,
          );
          filteredPlaylists = filteredPlaylists.filter(
            (playlist) => new Date(playlist.updatedAt).getTime() >= threshold,
          );
          filteredWatchParties = filteredWatchParties.filter(
            (party) => new Date(party.startTime).getTime() >= threshold,
          );
        }

        // Apply sorting
        const sortContent = <
          T extends {
            views?: string;
            likes?: number;
            title: string;
            uploadedAt?: string;
            updatedAt?: string;
            startTime?: string;
          },
        >(
          items: T[],
          sortBy: SearchSortBy,
        ): T[] => {
          switch (sortBy) {
            case "recent":
              return [...items].sort((a, b) => {
                const dateA = new Date(
                  a.uploadedAt || a.updatedAt || a.startTime || 0,
                ).getTime();
                const dateB = new Date(
                  b.uploadedAt || b.updatedAt || b.startTime || 0,
                ).getTime();
                return dateB - dateA;
              });
            case "popular":
            case "views":
              return [...items].sort((a, b) => {
                const viewsA = a.views ? parseViewCount(a.views) : a.likes || 0;
                const viewsB = b.views ? parseViewCount(b.views) : b.likes || 0;
                return viewsB - viewsA;
              });
            case "alphabetical":
              return [...items].sort((a, b) => a.title.localeCompare(b.title));
            default:
              // Simple relevance scoring based on query position in title
              return [...items].sort((a, b) => {
                const aIndex = a.title.toLowerCase().indexOf(lowerQuery);
                const bIndex = b.title.toLowerCase().indexOf(lowerQuery);
                if (aIndex === -1 && bIndex === -1) return 0;
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
              });
          }
        };

        const parseViewCount = (views: string): number => {
          if (views.endsWith("M")) return Number.parseFloat(views) * 1000000;
          if (views.endsWith("K")) return Number.parseFloat(views) * 1000;
          return Number.parseInt(views);
        };

        filteredVTubers = sortContent(filteredVTubers, filters.sortBy);
        filteredClips = sortContent(filteredClips, filters.sortBy);
        filteredPlaylists = sortContent(filteredPlaylists, filters.sortBy);
        filteredWatchParties = sortContent(
          filteredWatchParties,
          filters.sortBy,
        );

        const searchTime = Date.now() - searchStartTime;
        const totalResults =
          filteredVTubers.length +
          filteredClips.length +
          filteredPlaylists.length +
          filteredWatchParties.length;

        const results: SearchResults = {
          vtubers: filteredVTubers,
          clips: filteredClips,
          playlists: filteredPlaylists,
          watchParties: filteredWatchParties,
          totalResults,
          searchTime,
        };

        // Add to recent searches
        const newRecentSearch: RecentSearch = {
          id: Date.now().toString(),
          query,
          timestamp: new Date().toISOString(),
          resultCount: totalResults,
        };

        setSearchState((prev) => ({
          ...prev,
          results,
          isLoading: false,
          hasSearched: true,
          recentSearches: [newRecentSearch, ...prev.recentSearches.slice(0, 9)],
        }));
      }, 500);
    },
    [allVTubers, allClips, allPlaylists, allWatchParties],
  );

  // Event handlers
  const handleSearch = useCallback(
    (query: string) => {
      const newFilters = { ...searchState.filters, query };
      setSearchState((prev) => ({ ...prev, query, filters: newFilters }));
      performSearch(query, newFilters);
    },
    [searchState.filters, performSearch],
  );

  const handleFilterChange = useCallback(
    <T extends keyof SearchFilters>(filterType: T, value: SearchFilters[T]) => {
      const newFilters = { ...searchState.filters, [filterType]: value };
      setSearchState((prev) => ({ ...prev, filters: newFilters }));
      if (searchState.query) {
        performSearch(searchState.query, newFilters);
      }
    },
    [searchState.filters, searchState.query, performSearch],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: SearchSuggestion) => {
      handleSearch(suggestion.text);
    },
    [handleSearch],
  );

  const handleRecentSearchClick = useCallback(
    (recentSearch: RecentSearch) => {
      handleSearch(recentSearch.query);
    },
    [handleSearch],
  );

  const handlePopularSearchClick = useCallback(
    (popularSearch: PopularSearch) => {
      handleSearch(popularSearch.query);
    },
    [handleSearch],
  );

  const toggleAdvancedFilters = useCallback(() => {
    setSearchState((prev) => ({
      ...prev,
      showAdvancedFilters: !prev.showAdvancedFilters,
    }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState((prev) => ({
      ...prev,
      query: "",
      filters: { ...prev.filters, query: "" },
      results: null,
      hasSearched: false,
      error: null,
    }));
  }, []);

  // Search on initial load if query exists
  useEffect(() => {
    if (initialQuery && !searchState.hasSearched) {
      performSearch(initialQuery, searchState.filters);
    }
  }, [
    initialQuery,
    searchState.hasSearched,
    searchState.filters,
    performSearch,
  ]);

  // Memoized filtered suggestions
  const filteredSuggestions = useMemo(() => {
    if (!searchState.query || searchState.query.length < 2) {
      return [];
    }

    return searchState.suggestions
      .filter(
        (suggestion) =>
          suggestion.text
            .toLowerCase()
            .includes(searchState.query.toLowerCase()) &&
          suggestion.text.toLowerCase() !== searchState.query.toLowerCase(),
      )
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);
  }, [searchState.query, searchState.suggestions]);

  return (
    <SearchPagePresenter
      searchState={searchState}
      filteredSuggestions={filteredSuggestions}
      onSearch={handleSearch}
      onFilterChange={handleFilterChange}
      onSuggestionClick={handleSuggestionClick}
      onRecentSearchClick={handleRecentSearchClick}
      onPopularSearchClick={handlePopularSearchClick}
      onToggleAdvancedFilters={toggleAdvancedFilters}
      onClearSearch={clearSearch}
    />
  );
};

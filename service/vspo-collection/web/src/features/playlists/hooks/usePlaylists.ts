import { useMemo, useState } from "react";
import type { Playlist } from "../../../common/types/schemas";
import type { PlaylistCategory, PlaylistFilters } from "../types";

// Mock data - would come from API
const mockPlaylists: Playlist[] = [
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
  },
  {
    id: 9,
    title: "ホラゲ実況絶叫シーン集",
    creator: "ホラゲマニア",
    creatorBadge: "👻",
    thumbnail: "/placeholder.svg?height=180&width=320",
    videoCount: 30,
    views: "198.7K",
    topVideo: "【ホラー】史上最大の絶叫で配信事故",
    isHot: true,
    likes: 4567,
    watchPartyCount: 9,
    tags: ["ホラー", "ゲーム実況", "絶叫"],
  },
  {
    id: 10,
    title: "新人VTuberデビュー配信集",
    creator: "新人推し",
    creatorBadge: "🌟",
    thumbnail: "/placeholder.svg?height=180&width=320",
    videoCount: 8,
    views: "56.2K",
    topVideo: "【デビュー】緊張で噛みまくりが可愛い",
    isHot: false,
    likes: 1567,
    watchPartyCount: 3,
    tags: ["デビュー", "新人", "初配信"],
  },
];

const categoryMap: Record<PlaylistCategory, string[]> = {
  all: [],
  gaming: ["ゲーム実況", "APEX", "FPS", "マイクラ", "ホラー"],
  music: ["歌ってみた", "音楽", "ボカロ"],
  collab: ["コラボ"],
  asmr: ["ASMR", "癒やし", "睡眠導入"],
  art: ["お絵描き", "イラスト", "アート"],
  talk: ["雑談", "本音", "感動"],
  cooking: ["料理"],
  special: ["記念配信", "重大発表", "新衣装", "デビュー", "初配信"],
};

export const usePlaylists = (initialFilters?: Partial<PlaylistFilters>) => {
  const [filters, setFilters] = useState<PlaylistFilters>({
    category: initialFilters?.category || "all",
    sortBy: initialFilters?.sortBy || "popular",
    searchQuery: initialFilters?.searchQuery || "",
  });

  const filteredPlaylists = useMemo(() => {
    let filtered = [...mockPlaylists];

    // Apply category filter
    if (filters.category !== "all") {
      const categoryTags = categoryMap[filters.category];
      filtered = filtered.filter((playlist) =>
        playlist.tags.some((tag) => categoryTags.includes(tag)),
      );
    }

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (playlist) =>
          playlist.title.toLowerCase().includes(query) ||
          playlist.creator.toLowerCase().includes(query) ||
          playlist.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "popular":
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case "recent":
        // In real app, would sort by createdAt
        filtered.sort((a, b) => b.id - a.id);
        break;
      case "mostVideos":
        filtered.sort((a, b) => b.videoCount - a.videoCount);
        break;
      case "trending":
        filtered.sort((a, b) => {
          const aScore = a.isHot ? 1000 : 0;
          const bScore = b.isHot ? 1000 : 0;
          return bScore + b.watchPartyCount - (aScore + a.watchPartyCount);
        });
        break;
      case "alphabetical":
        filtered.sort((a, b) => a.title.localeCompare(b.title, "ja"));
        break;
    }

    return filtered;
  }, [filters]);

  const updateFilters = (updates: Partial<PlaylistFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const getPlaylistsByCreator = (creatorName: string) => {
    return mockPlaylists.filter((playlist) => playlist.creator === creatorName);
  };

  const getTrendingPlaylists = (limit = 3) => {
    return [...mockPlaylists]
      .filter((p) => p.isHot)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);
  };

  return {
    playlists: filteredPlaylists,
    filters,
    updateFilters,
    getPlaylistsByCreator,
    getTrendingPlaylists,
    totalCount: mockPlaylists.length,
    filteredCount: filteredPlaylists.length,
  };
};

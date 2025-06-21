"use client";

import { useCallback, useState } from "react";
import type { Clip } from "../../../../common/types/schemas";
import { ClipsPagePresenter } from "./presenter";

// Platform types
export type Platform =
  | "all"
  | "youtube"
  | "twitch"
  | "twitcasting"
  | "niconico";
export type ClipType = "all" | "clips" | "shorts";
export type SortBy = "views" | "recent" | "likes";
export type ViewMode = "grid" | "list";

// Extended Clip type with platform info
interface ExtendedClip extends Clip {
  platform: Platform;
  clipType: ClipType;
  uploadedAt: string;
}

// Mock data generator
const generateMockClips = (): ExtendedClip[] => {
  const platforms: Platform[] = [
    "youtube",
    "twitch",
    "twitcasting",
    "niconico",
  ];
  const clipTypes: ClipType[] = ["clips", "shorts"];
  const vtubers = [
    "🦄 みおちゃん",
    "🌺 ひまりちゃん",
    "🌸 さくらちゃん",
    "🎨 あやちゃん",
    "🌙 るなちゃん",
    "⭐ ななちゃん",
    "🍑 ももちゃん",
    "☁️ そらちゃん",
    "🌟 ゆめちゃん",
    "🎀 りこちゃん",
  ];

  const clippers = [
    "切り抜きマスター",
    "面白切り抜き",
    "ASMR切り抜き",
    "アート系まとめ",
    "ゲーム切り抜き専門",
    "事故系まとめ",
    "神回コレクター",
    "感動シーンまとめ",
    "てぇてぇ切り抜き",
    "歌ってみた専門",
  ];

  const titles = [
    "【神回】泣ける感動シーンまとめ",
    "【爆笑】ゲーム実況で大失敗www",
    "【歌ってみた】圧倒的歌唱力に視聴者騒然",
    "【ASMR】癒やしボイスで安眠確定",
    "【コラボ】推し同士の絡みがてぇてぇすぎる",
    "【ホラゲ】可愛い悲鳴集めました",
    "【雑談】深夜のまったりトーク切り抜き",
    "【お絵描き】神絵師の制作過程",
    "【料理配信】失敗からの大成功まで",
    "【FPS】エイムが神すぎる瞬間集",
  ];

  const clips: ExtendedClip[] = [];

  for (let i = 1; i <= 50; i++) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const clipType = clipTypes[Math.floor(Math.random() * clipTypes.length)];
    const viewCount = Math.floor(Math.random() * 500000) + 10000;
    const likes = Math.floor(viewCount * (Math.random() * 0.1 + 0.05));
    const comments = Math.floor(likes * (Math.random() * 0.3 + 0.1));

    clips.push({
      id: i,
      title: titles[Math.floor(Math.random() * titles.length)],
      vtuber: vtubers[Math.floor(Math.random() * vtubers.length)],
      thumbnail: `/placeholder.svg?height=180&width=320&text=Clip${i}`,
      duration:
        clipType === "shorts"
          ? `0:${Math.floor(Math.random() * 50) + 10}`
          : `${Math.floor(Math.random() * 20) + 1}:${Math.floor(
              Math.random() * 60,
            )
              .toString()
              .padStart(2, "0")}`,
      views:
        viewCount > 1000000
          ? `${(viewCount / 1000000).toFixed(1)}M`
          : viewCount > 1000
            ? `${Math.floor(viewCount / 1000)}K`
            : viewCount.toString(),
      clipper: clippers[Math.floor(Math.random() * clippers.length)],
      isExclusive: Math.random() > 0.7,
      likes,
      comments,
      watchPartyActive: Math.random() > 0.8,
      platform,
      clipType,
      uploadedAt: new Date(
        Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      ).toISOString(),
    });
  }

  return clips;
};

export const ClipsPageContainer = () => {
  // State
  const [allClips] = useState<ExtendedClip[]>(generateMockClips());
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("all");
  const [selectedType, setSelectedType] = useState<ClipType>("all");
  const [sortBy, setSortBy] = useState<SortBy>("views");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 12;

  // Filter and sort clips
  const filteredAndSortedClips = useCallback(() => {
    let filtered = [...allClips];

    // Filter by platform
    if (selectedPlatform !== "all") {
      filtered = filtered.filter((clip) => clip.platform === selectedPlatform);
    }

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter((clip) => clip.clipType === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (clip) =>
          clip.title.toLowerCase().includes(query) ||
          clip.vtuber.toLowerCase().includes(query) ||
          clip.clipper.toLowerCase().includes(query),
      );
    }

    // Sort
    switch (sortBy) {
      case "views":
        filtered.sort((a, b) => {
          const aViews = parseViewCount(a.views);
          const bViews = parseViewCount(b.views);
          return bViews - aViews;
        });
        break;
      case "recent":
        filtered.sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
        );
        break;
      case "likes":
        filtered.sort((a, b) => b.likes - a.likes);
        break;
    }

    return filtered;
  }, [allClips, selectedPlatform, selectedType, searchQuery, sortBy]);

  // Parse view count string to number
  const parseViewCount = (views: string): number => {
    if (views.endsWith("M")) {
      return Number.parseFloat(views) * 1000000;
    }
    if (views.endsWith("K")) {
      return Number.parseFloat(views) * 1000;
    }
    return Number.parseInt(views);
  };

  // Get paginated clips
  const paginatedClips = useCallback(() => {
    const filtered = filteredAndSortedClips();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filteredAndSortedClips, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredAndSortedClips().length / itemsPerPage);

  // Event handlers
  const handlePlatformChange = (platform: Platform) => {
    setSelectedPlatform(platform);
    setCurrentPage(1);
  };

  const handleTypeChange = (type: ClipType) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: SortBy) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleClipClick = (clip: ExtendedClip) => {
    alert(
      `Playing: ${clip.title}\n\nby ${clip.vtuber}\nClipped by: ${clip.clipper}`,
    );
  };

  const handleLike = (clip: ExtendedClip) => {
    alert(`Liked: ${clip.title}`);
  };

  const handleWatchParty = (clip: ExtendedClip) => {
    alert(`Joining watch party for: ${clip.title}`);
  };

  return (
    <ClipsPagePresenter
      // Data
      clips={paginatedClips()}
      totalClips={filteredAndSortedClips().length}
      currentPage={currentPage}
      totalPages={totalPages}
      isLoading={isLoading}
      // Filters
      selectedPlatform={selectedPlatform}
      selectedType={selectedType}
      sortBy={sortBy}
      viewMode={viewMode}
      searchQuery={searchQuery}
      // Handlers
      onPlatformChange={handlePlatformChange}
      onTypeChange={handleTypeChange}
      onSortChange={handleSortChange}
      onViewModeChange={handleViewModeChange}
      onSearch={handleSearch}
      onPageChange={handlePageChange}
      onClipClick={handleClipClick}
      onLike={handleLike}
      onWatchParty={handleWatchParty}
    />
  );
};

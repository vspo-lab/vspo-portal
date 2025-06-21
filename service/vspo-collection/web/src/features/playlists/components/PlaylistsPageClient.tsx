"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Playlist } from "../../../common/types/schemas";
import type {
  PlaylistCategory,
  PlaylistSortOption,
} from "../../../lib/services/playlists-service";
import { useSparkleEffect } from "../../../shared/hooks/useSparkleEffect";
import { useUserProfile } from "../../user/hooks/useUserProfile";
import { PlaylistsPagePresenter } from "../pages/PlaylistsPage/presenter";

interface PlaylistsPageClientProps {
  initialPlaylists: Playlist[];
  trendingPlaylists: Playlist[];
}

interface PlaylistFilters {
  category: PlaylistCategory;
  sortBy: PlaylistSortOption;
  searchQuery: string;
}

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

export const PlaylistsPageClient = ({
  initialPlaylists,
  trendingPlaylists,
}: PlaylistsPageClientProps) => {
  const router = useRouter();
  const { userProfile, addPoints } = useUserProfile();
  const { sparkles, addSparkles } = useSparkleEffect();

  const [filters, setFilters] = useState<PlaylistFilters>({
    category: "all",
    sortBy: "popular",
    searchQuery: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort playlists
  const filteredPlaylists = useMemo(() => {
    let filtered = [...initialPlaylists];

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
  }, [initialPlaylists, filters]);

  const updateFilters = (updates: Partial<PlaylistFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  // Event handlers
  const handleCategoryChange = (category: PlaylistCategory) => {
    updateFilters({ category });
    addSparkles([
      { x: Math.random() * 100, y: Math.random() * 100 },
      { x: Math.random() * 100, y: Math.random() * 100 },
    ]);
    addPoints(2);
  };

  const handleSortChange = (sortBy: PlaylistSortOption) => {
    updateFilters({ sortBy });
    addPoints(1);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      updateFilters({ searchQuery: searchQuery.trim() });
      addSparkles([
        { x: 50, y: 20 },
        { x: 60, y: 25 },
        { x: 40, y: 30 },
      ]);
      addPoints(5);
    }
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    updateFilters({ searchQuery: "" });
  };

  const handlePlaylistClick = (playlistId: number) => {
    addPoints(10);
    router.push(`/playlists/${playlistId}`);
  };

  const handlePlaylistLike = (playlistId: number) => {
    addSparkles([{ x: Math.random() * 100, y: Math.random() * 100 }]);
    addPoints(3);
    console.log("Liked playlist:", playlistId);
  };

  const handleWatchPartyJoin = (playlistId: number) => {
    addPoints(15);
    alert(
      `ウォッチパーティに参加しました！\n\nプレイリストID: ${playlistId}\n\n+15ポイント獲得！`,
    );
  };

  const handleCreatePlaylist = () => {
    addPoints(20);
    alert("新しいプレイリストを作成します！\n\n+20ポイント獲得！");
  };

  const categoryLabels: Record<PlaylistCategory, string> = {
    all: "すべて",
    gaming: "ゲーム",
    music: "音楽",
    collab: "コラボ",
    asmr: "ASMR",
    art: "アート",
    talk: "雑談",
    cooking: "料理",
    special: "特別配信",
  };

  const sortLabels: Record<PlaylistSortOption, string> = {
    popular: "人気順",
    recent: "新着順",
    mostVideos: "動画数順",
    trending: "トレンド",
    alphabetical: "あいうえお順",
  };

  return (
    <PlaylistsPagePresenter
      // State
      playlists={filteredPlaylists}
      trendingPlaylists={trendingPlaylists}
      userProfile={userProfile}
      sparkles={sparkles}
      searchQuery={searchQuery}
      selectedCategory={filters.category}
      selectedSort={filters.sortBy}
      filteredCount={filteredPlaylists.length}
      totalCount={initialPlaylists.length}
      categoryLabels={categoryLabels}
      sortLabels={sortLabels}
      // Event handlers
      onSearchQueryChange={setSearchQuery}
      onSearch={handleSearch}
      onSearchClear={handleSearchClear}
      onCategoryChange={handleCategoryChange}
      onSortChange={handleSortChange}
      onPlaylistClick={handlePlaylistClick}
      onPlaylistLike={handlePlaylistLike}
      onWatchPartyJoin={handleWatchPartyJoin}
      onCreatePlaylist={handleCreatePlaylist}
    />
  );
};

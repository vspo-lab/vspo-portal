"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSparkleEffect } from "../../../../shared/hooks/useSparkleEffect";
import { useUserProfile } from "../../../user/hooks/useUserProfile";
import { usePlaylists } from "../../hooks/usePlaylists";
import type { PlaylistCategory, PlaylistSortOption } from "../../types";
import { PlaylistsPagePresenter } from "./presenter";

export const PlaylistsPageContainer = () => {
  const router = useRouter();
  const {
    playlists,
    filters,
    updateFilters,
    getTrendingPlaylists,
    filteredCount,
    totalCount,
  } = usePlaylists();
  const { userProfile, addPoints } = useUserProfile();
  const { sparkles, addSparkles } = useSparkleEffect();

  const [searchQuery, setSearchQuery] = useState(filters.searchQuery);

  const trendingPlaylists = getTrendingPlaylists(3);

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
    // In real app, would call API to like playlist
    console.log("Liked playlist:", playlistId);
  };

  const handleWatchPartyJoin = (playlistId: number) => {
    addPoints(15);
    // In real app, would join watch party
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
      playlists={playlists}
      trendingPlaylists={trendingPlaylists}
      userProfile={userProfile}
      sparkles={sparkles}
      searchQuery={searchQuery}
      selectedCategory={filters.category}
      selectedSort={filters.sortBy}
      filteredCount={filteredCount}
      totalCount={totalCount}
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

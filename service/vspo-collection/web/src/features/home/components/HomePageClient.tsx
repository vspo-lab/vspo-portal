"use client";

import { useState } from "react";
import type {
  Clip,
  LiveWatchParty,
  Playlist,
  Recommendation,
  SpecialEvent,
} from "../../../common/types/schemas";
import { useOnlineUsers } from "../../../shared/hooks/useOnlineUsers";
import { useSparkleEffect } from "../../../shared/hooks/useSparkleEffect";
import { useLiveWatchParty } from "../../live-watch-party/hooks/useLiveWatchParty";
import { useUserProfile } from "../../user/hooks/useUserProfile";
import { HomePagePresenter } from "../pages/HomePage/presenter";

interface HomePageClientProps {
  specialEvent: SpecialEvent;
  categories: string[];
  trendingPlaylists: Playlist[];
  popularClips: Clip[];
  recommendations: Recommendation[];
}

export const HomePageClient = ({
  specialEvent,
  categories,
  trendingPlaylists,
  popularClips,
  recommendations,
}: HomePageClientProps) => {
  const [activeCategory, setActiveCategory] = useState("🔥 トレンド");
  const [searchQuery, setSearchQuery] = useState("");

  // Custom hooks
  const { userProfile, addPoints } = useUserProfile();
  const { liveWatchParties, handleJoinWatchParty, handleCreateWatchParty } =
    useLiveWatchParty();
  const { sparkles, addSparkles } = useSparkleEffect();
  const onlineUsers = useOnlineUsers();

  // Event handlers
  const handleSearch = () => {
    if (searchQuery.trim()) {
      addSparkles([
        { x: 50, y: 20 },
        { x: 60, y: 25 },
        { x: 40, y: 30 },
      ]);
      alert(
        `🔍 "${searchQuery}" を検索しています...\n\n関連するVtuberと切り抜きを探しています♡\n\n+10ポイント獲得！`,
      );
      addPoints(10);
      setSearchQuery("");
    }
  };

  const handleVideoClick = (title: string, type: string) => {
    addPoints(5);
    alert(`▶️ ${title}\n\n${type}を再生します！\n\n+5ポイント獲得！`);
  };

  const handlePlaylistClick = (title: string) => {
    addPoints(15);
    alert(
      `📋 プレイリスト: ${title}\n\nプレイリストページを開きます！\n\n・全動画一覧\n・作成者情報\n・関連プレイリスト\n\n+15ポイント獲得！`,
    );
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    alert(
      `📂 "${category}" カテゴリを選択しました！\n\nこのカテゴリの人気コンテンツを表示します♡`,
    );
  };

  const handleLike = () => {
    addPoints(2);
    alert("💕 いいね！しました\n\n+2ポイント獲得！");
  };

  const handleWatchPartyJoin = (
    room: Parameters<typeof handleJoinWatchParty>[0],
  ) => {
    handleJoinWatchParty(room, addPoints);
  };

  return (
    <HomePagePresenter
      // State
      activeCategory={activeCategory}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      userProfile={userProfile}
      onlineUsers={onlineUsers}
      sparkles={sparkles}
      specialEvent={specialEvent}
      categories={categories}
      liveWatchParties={liveWatchParties}
      trendingPlaylists={trendingPlaylists}
      popularClips={popularClips}
      recommendations={recommendations}
      // Event handlers
      onSearch={handleSearch}
      onVideoClick={handleVideoClick}
      onPlaylistClick={handlePlaylistClick}
      onCategoryClick={handleCategoryClick}
      onLike={handleLike}
      onWatchPartyJoin={handleWatchPartyJoin}
      onCreateWatchParty={handleCreateWatchParty}
    />
  );
};

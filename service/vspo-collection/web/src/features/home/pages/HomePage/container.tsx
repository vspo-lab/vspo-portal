"use client";

import { useState } from "react";
import type {
  Clip,
  Playlist,
  Recommendation,
  SpecialEvent,
} from "../../../../common/types/schemas";
import { useOnlineUsers } from "../../../../shared/hooks/useOnlineUsers";
import { useSparkleEffect } from "../../../../shared/hooks/useSparkleEffect";
import { useLiveWatchParty } from "../../../live-watch-party/hooks/useLiveWatchParty";
import { useNavigation } from "../../../navigation/hooks/useNavigation";
import { useUserProfile } from "../../../user/hooks/useUserProfile";
import { HomePagePresenter } from "./presenter";

// Mock data - these would typically come from API calls
const specialEvent: SpecialEvent = {
  title: "🎉 推しコレ1周年記念イベント開催中！",
  description: "限定バッジがもらえるチャンス",
  timeLeft: "あと2日",
  isActive: true,
};

const categories = [
  "🔥 トレンド",
  "🎵 歌ってみた",
  "🎮 ゲーム実況",
  "💬 雑談",
  "🎨 お絵描き",
  "🎭 ASMR",
  "🎪 コラボ",
];

const trendingPlaylists: Playlist[] = [
  {
    id: 1,
    title: "みおちゃんの神回まとめ",
    creator: "ファン太郎",
    creatorBadge: "💎",
    thumbnail: "/placeholder.svg?height=80&width=120",
    videoCount: 12,
    views: "89.2K",
    topVideo: "【歌ってみた】新曲MV公開で大バズり中！",
    isHot: true,
    likes: 1247,
    watchPartyCount: 3,
    tags: ["歌ってみた", "新曲", "バズり中"],
  },
  {
    id: 2,
    title: "ひまりちゃんホラゲ爆笑集",
    creator: "切り抜き職人",
    creatorBadge: "⚡",
    thumbnail: "/placeholder.svg?height=80&width=120",
    videoCount: 8,
    views: "76.5K",
    topVideo: "【ホラゲ実況】可愛すぎる悲鳴で視聴者悶絶",
    isHot: false,
    likes: 892,
    watchPartyCount: 5,
    tags: ["ゲーム実況", "ホラー", "面白い"],
  },
  {
    id: 3,
    title: "さくらちゃんASMR癒やし集",
    creator: "癒やし系まとめ",
    creatorBadge: "🌸",
    thumbnail: "/placeholder.svg?height=80&width=120",
    videoCount: 15,
    views: "54.3K",
    topVideo: "【ASMR】耳元で囁く天使の声",
    isHot: true,
    likes: 756,
    watchPartyCount: 2,
    tags: ["ASMR", "癒やし", "睡眠導入"],
  },
];

const popularClips: Clip[] = [
  {
    id: 1,
    title: "【みおちゃん】天使の歌声に涙腺崩壊...",
    vtuber: "🦄 みおちゃん",
    thumbnail: "/placeholder.svg?height=80&width=120",
    duration: "2:34",
    views: "125K",
    clipper: "切り抜きマスター",
    isExclusive: true,
    likes: 3421,
    comments: 156,
    watchPartyActive: true,
  },
  {
    id: 2,
    title: "【ひまりちゃん】下手すぎて逆にプロ級www",
    vtuber: "🌺 ひまりちゃん",
    thumbnail: "/placeholder.svg?height=80&width=120",
    duration: "1:47",
    views: "98K",
    clipper: "面白切り抜き",
    isExclusive: false,
    likes: 2156,
    comments: 89,
    watchPartyActive: false,
  },
  {
    id: 3,
    title: "【さくらちゃん】この声で眠れない人いる？",
    vtuber: "🌸 さくらちゃん",
    thumbnail: "/placeholder.svg?height=80&width=120",
    duration: "5:12",
    views: "87K",
    clipper: "ASMR切り抜き",
    isExclusive: true,
    likes: 1987,
    comments: 234,
    watchPartyActive: true,
  },
  {
    id: 4,
    title: "【あやちゃん】神絵師すぎて言葉が出ない",
    vtuber: "🎨 あやちゃん",
    thumbnail: "/placeholder.svg?height=80&width=120",
    duration: "3:28",
    views: "76K",
    clipper: "アート系まとめ",
    isExclusive: false,
    likes: 1543,
    comments: 67,
    watchPartyActive: false,
  },
];

const recommendations: Recommendation[] = [
  {
    id: 1,
    title: "【ももちゃん】新人とは思えない歌唱力",
    vtuber: "🍑 ももちゃん",
    thumbnail: "/placeholder.svg?height=60&width=80",
    duration: "3:21",
    views: "42K",
    reason: "歌が好きなあなたに",
    isPersonalized: true,
  },
  {
    id: 2,
    title: "【ゆめちゃん】深夜雑談で本音トーク",
    vtuber: "🌙 ゆめちゃん",
    thumbnail: "/placeholder.svg?height=60&width=80",
    duration: "7:18",
    views: "38K",
    reason: "雑談系がお好み？",
    isPersonalized: true,
  },
  {
    id: 3,
    title: "【そらちゃん】デビュー配信が可愛すぎる",
    vtuber: "☁️ そらちゃん",
    thumbnail: "/placeholder.svg?height=60&width=80",
    duration: "2:45",
    views: "35K",
    reason: "新人Vtuber!",
    isPersonalized: false,
  },
];

export const HomePageContainer = () => {
  const [activeCategory, setActiveCategory] = useState("🔥 トレンド");
  const [searchQuery, setSearchQuery] = useState("");

  // Custom hooks
  const { userProfile, addPoints } = useUserProfile();
  const { liveWatchParties, handleJoinWatchParty, handleCreateWatchParty } =
    useLiveWatchParty();
  const { sparkles, addSparkles } = useSparkleEffect();
  const onlineUsers = useOnlineUsers();
  const navigation = useNavigation();

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
      // Navigation
      navigation={navigation}
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

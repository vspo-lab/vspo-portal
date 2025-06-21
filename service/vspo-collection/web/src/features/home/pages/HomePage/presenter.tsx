import {
  Bell,
  Calendar,
  Clock,
  Crown,
  Eye,
  Heart,
  MessageCircle,
  Play,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import type {
  Clip,
  LiveWatchParty,
  Playlist,
  Recommendation,
  Sparkle,
  SpecialEvent,
  UserProfile,
} from "../../../../common/types/schemas";
import { Button } from "../../../../shared/components/presenters/Button";
import { SparkleEffect } from "../../../../shared/components/presenters/SparkleEffect";

interface HomePagePresenterProps {
  // State
  activeCategory: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userProfile: UserProfile;
  onlineUsers: number;
  sparkles: Sparkle[];
  specialEvent: SpecialEvent;
  categories: string[];
  liveWatchParties: LiveWatchParty[];
  trendingPlaylists: Playlist[];
  popularClips: Clip[];
  recommendations: Recommendation[];

  // Event handlers
  onSearch: () => void;
  onVideoClick: (title: string, type: string) => void;
  onPlaylistClick: (title: string) => void;
  onCategoryClick: (category: string) => void;
  onLike: () => void;
  onWatchPartyJoin: (room: LiveWatchParty) => void;
  onCreateWatchParty: () => void;
}

export const HomePagePresenter = ({
  activeCategory,
  searchQuery,
  setSearchQuery,
  userProfile,
  onlineUsers,
  sparkles,
  specialEvent,
  categories,
  liveWatchParties,
  trendingPlaylists,
  popularClips,
  recommendations,
  onSearch,
  onVideoClick,
  onPlaylistClick,
  onCategoryClick,
  onLike,
  onWatchPartyJoin,
  onCreateWatchParty,
}: HomePagePresenterProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900">
      <SparkleEffect sparkles={sparkles} />

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg border-b border-white/10 safe-area-top">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="max-w-7xl mx-auto">
            {/* Special Event Banner */}
            {specialEvent.isActive && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl backdrop-blur-sm border border-yellow-500/30">
                <div className="flex items-center justify-between flex-col sm:flex-row gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-pulse flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="text-white font-bold text-sm sm:text-base">
                        {specialEvent.title}
                      </h3>
                      <p className="text-white/80 text-xs sm:text-sm line-clamp-2">
                        {specialEvent.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-white/90 font-bold bg-orange-500/30 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm whitespace-nowrap">
                    {specialEvent.timeLeft}
                  </span>
                </div>
              </div>
            )}

            {/* Site Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ぶいすぽっ推しコレ！
              </h1>
              <p className="text-white/80 text-sm sm:text-base lg:text-lg px-4">
                みんなで推しの最高の瞬間を共有しよう
              </p>
            </div>

            {/* User Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-base sm:text-lg">
                      {userProfile.username.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm sm:text-base">
                      {userProfile.username}
                    </p>
                    <p className="text-white/70 text-xs sm:text-sm flex items-center gap-1">
                      <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                      <span className="truncate">
                        Lv.{userProfile.level} • {userProfile.points}pts
                      </span>
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-white/80">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-semibold text-xs sm:text-sm">
                    {onlineUsers.toLocaleString()}人がオンライン
                  </span>
                </div>
              </div>

              {/* Mobile online users */}
              <div className="flex sm:hidden items-center gap-2 text-white/80 text-xs">
                <Users className="w-4 h-4" />
                <span className="font-semibold">
                  {onlineUsers.toLocaleString()}人がオンライン
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Button variant="ghost" size="sm" className="touch-target">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="touch-target">
                  <Calendar className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && onSearch()}
                placeholder="推しの切り抜きを検索..."
                className="w-full px-4 sm:px-6 py-3 sm:py-4 pr-20 sm:pr-24 rounded-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-purple-500/50 transition-all text-sm sm:text-base"
              />
              <Button
                onClick={onSearch}
                variant="accent"
                size="sm"
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 touch-target"
                sparkle
              >
                <Search className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">検索</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => onCategoryClick(category)}
                variant={activeCategory === category ? "primary" : "ghost"}
                size="sm"
                className="whitespace-nowrap touch-target flex-shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
        {/* Live Watch Parties */}
        <section className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400 flex-shrink-0" />
              <span className="truncate">ライブウォッチパーティー</span>
            </h2>
            <Button
              onClick={onCreateWatchParty}
              variant="secondary"
              size="sm"
              sparkle
              className="touch-target whitespace-nowrap"
            >
              <span className="hidden sm:inline">パーティーを作成</span>
              <span className="sm:hidden">作成</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {liveWatchParties.map((party) => (
              <div
                key={party.id}
                className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-semibold mb-1 text-sm sm:text-base line-clamp-2">
                      {party.title}
                    </h3>
                    <p className="text-white/70 text-xs sm:text-sm">
                      {party.hostUser}がホスト
                    </p>
                  </div>
                  {party.status === "LIVE" && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse flex-shrink-0">
                      LIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-white/80 text-xs sm:text-sm mb-2 sm:mb-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    {party.viewers}人
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    {Math.floor(party.viewers * 2.5)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    {party.status === "LIVE" ? "配信中" : party.startTime}
                  </span>
                </div>
                <p className="text-white/60 text-xs sm:text-sm mb-3 line-clamp-2">
                  {party.vtuber}の配信を一緒に視聴中！
                </p>
                <Button
                  onClick={() => onWatchPartyJoin(party)}
                  variant="primary"
                  size="sm"
                  className="w-full touch-target"
                >
                  参加する
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Trending Playlists */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-400" />
              トレンドプレイリスト
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => onPlaylistClick(playlist.title)}
                className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
              >
                <div className="relative h-32 bg-gradient-to-br from-purple-500 to-pink-500">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                  {playlist.isHot && (
                    <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                      HOT
                    </span>
                  )}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 text-white">
                    <Video className="w-4 h-4" />
                    <span className="text-sm font-semibold">
                      {playlist.videoCount}本
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2 line-clamp-1">
                    {playlist.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-white/70 text-sm">
                      {playlist.creator}
                    </span>
                    <span className="text-2xl">{playlist.creatorBadge}</span>
                  </div>
                  <p className="text-white/60 text-sm mb-3 line-clamp-2">
                    {playlist.topVideo}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white/70 text-sm">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {playlist.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {playlist.likes}
                      </span>
                    </div>
                    {playlist.watchPartyCount > 0 && (
                      <span className="text-pink-400 text-sm font-semibold">
                        {playlist.watchPartyCount}パーティー
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Clips Carousel */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Play className="w-6 h-6 text-green-400" />
              人気の切り抜き
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
            {popularClips.map((clip) => (
              <div
                key={clip.id}
                onClick={() => onVideoClick(clip.title, "切り抜き")}
                className="flex-shrink-0 w-80 bg-gradient-to-br from-green-600/20 to-teal-600/20 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all cursor-pointer group"
              >
                <div className="relative h-44 bg-gradient-to-br from-green-500 to-teal-500">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 transition-all" />
                  </div>
                  {clip.isExclusive && (
                    <span className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                      独占
                    </span>
                  )}
                  {clip.watchPartyActive && (
                    <span className="absolute top-2 right-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                      パーティー中
                    </span>
                  )}
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {clip.duration}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold mb-2 line-clamp-2">
                    {clip.title}
                  </h3>
                  <p className="text-white/70 text-sm mb-2">{clip.vtuber}</p>
                  <p className="text-white/60 text-xs mb-3">
                    by {clip.clipper}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white/70 text-sm">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {clip.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {clip.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {clip.comments}
                      </span>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLike();
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-400" />
              あなたへのおすすめ
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => onVideoClick(rec.title, "おすすめ")}
                className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer group flex gap-4"
              >
                <div className="flex-shrink-0 w-24 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <Play className="w-6 h-6 text-white opacity-80 group-hover:opacity-100 transition-all" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                    {rec.title}
                  </h3>
                  <p className="text-white/70 text-xs mb-2">{rec.vtuber}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">
                      {rec.views} • {rec.duration}
                    </span>
                    {rec.isPersonalized && (
                      <span className="text-yellow-400 text-xs">
                        {rec.reason}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

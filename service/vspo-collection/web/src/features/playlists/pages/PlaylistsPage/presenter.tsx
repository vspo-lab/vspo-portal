import {
  Eye,
  Filter,
  Heart,
  Play,
  Plus,
  Search,
  TrendingUp,
  Users,
  Video,
  X,
} from "lucide-react";
import type {
  Playlist,
  Sparkle,
  UserProfile,
} from "../../../../common/types/schemas";
import { Button } from "../../../../shared/components/presenters/Button";
import { SparkleEffect } from "../../../../shared/components/presenters/SparkleEffect";
import type { PlaylistCategory, PlaylistSortOption } from "../../types";

interface PlaylistsPagePresenterProps {
  // State
  playlists: Playlist[];
  trendingPlaylists: Playlist[];
  userProfile: UserProfile;
  sparkles: Sparkle[];
  searchQuery: string;
  selectedCategory: PlaylistCategory;
  selectedSort: PlaylistSortOption;
  filteredCount: number;
  totalCount: number;
  categoryLabels: Record<PlaylistCategory, string>;
  sortLabels: Record<PlaylistSortOption, string>;

  // Event handlers
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  onSearchClear: () => void;
  onCategoryChange: (category: PlaylistCategory) => void;
  onSortChange: (sort: PlaylistSortOption) => void;
  onPlaylistClick: (playlistId: number) => void;
  onPlaylistLike: (playlistId: number) => void;
  onWatchPartyJoin: (playlistId: number) => void;
  onCreatePlaylist: () => void;
}

export const PlaylistsPagePresenter = ({
  playlists,
  trendingPlaylists,
  userProfile,
  sparkles,
  searchQuery,
  selectedCategory,
  selectedSort,
  filteredCount,
  totalCount,
  categoryLabels,
  sortLabels,
  onSearchQueryChange,
  onSearch,
  onSearchClear,
  onCategoryChange,
  onSortChange,
  onPlaylistClick,
  onPlaylistLike,
  onWatchPartyJoin,
  onCreatePlaylist,
}: PlaylistsPagePresenterProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden safe-area-top">
      <SparkleEffect sparkles={sparkles} />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                📋 プレイリスト
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                {filteredCount.toLocaleString()}件のプレイリスト
                {filteredCount !== totalCount && (
                  <span className="text-xs sm:text-sm text-purple-600">
                    （全{totalCount.toLocaleString()}件中）
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="text-xs sm:text-sm text-gray-600">
                Lv.{userProfile.level} | {userProfile.points.toLocaleString()}pt
              </div>
              <Button
                onClick={onCreatePlaylist}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 touch-target whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">新規作成</span>
                <span className="sm:hidden">作成</span>
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4 sm:mb-6">
            <div className="flex items-center bg-white rounded-xl border-2 border-purple-100 focus-within:border-purple-300 transition-colors">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-3 sm:ml-4 flex-shrink-0" />
              <input
                type="text"
                placeholder="プレイリストを検索..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && onSearch()}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl outline-none text-sm sm:text-base min-w-0"
              />
              {searchQuery && (
                <button
                  onClick={onSearchClear}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors touch-target"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <Button
                onClick={onSearch}
                size="sm"
                className="m-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all touch-target"
              >
                <span className="hidden sm:inline">検索</span>
                <Search className="w-4 h-4 sm:hidden" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) =>
                  onCategoryChange(e.target.value as PlaylistCategory)
                }
                className="flex-1 sm:flex-none px-2 sm:px-3 py-2 bg-white border-2 border-purple-100 rounded-lg focus:border-purple-300 outline-none text-sm sm:text-base touch-target"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <select
                value={selectedSort}
                onChange={(e) =>
                  onSortChange(e.target.value as PlaylistSortOption)
                }
                className="flex-1 sm:flex-none px-2 sm:px-3 py-2 bg-white border-2 border-purple-100 rounded-lg focus:border-purple-300 outline-none text-sm sm:text-base touch-target"
              >
                {Object.entries(sortLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Trending Section */}
        {selectedCategory === "all" && !searchQuery && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                🔥 トレンドプレイリスト
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {trendingPlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="group bg-white rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl active:shadow-lg transition-all duration-300 border border-orange-100 hover:border-orange-200 cursor-pointer touch-target"
                  onClick={() => onPlaylistClick(playlist.id)}
                >
                  <div className="relative mb-3 sm:mb-4">
                    <img
                      src={playlist.thumbnail}
                      alt={playlist.title}
                      className="w-full h-24 sm:h-32 object-cover rounded-xl"
                    />
                    <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-gradient-to-r from-orange-400 to-red-400 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-xs font-medium">
                      🔥 HOT
                    </div>
                    <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-black/70 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">
                      {playlist.videoCount}本
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors text-sm sm:text-base">
                    {playlist.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 gap-2">
                    <span className="truncate">
                      {playlist.creator} {playlist.creatorBadge}
                    </span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <Eye className="w-3 h-3" />
                      {playlist.views}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 min-w-0 flex-1">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span className="truncate">
                          {playlist.likes.toLocaleString()}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{playlist.watchPartyCount}</span>
                      </span>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWatchPartyJoin(playlist.id);
                      }}
                      size="xs"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all touch-target flex-shrink-0"
                    >
                      参加
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Playlist Grid */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {selectedCategory === "all"
                ? "すべてのプレイリスト"
                : `${categoryLabels[selectedCategory]}のプレイリスト`}
            </h2>
            <div className="text-xs sm:text-sm text-gray-600">
              {sortLabels[selectedSort]}で表示中
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 tablet:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="group bg-white rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-xl active:shadow-lg transition-all duration-300 border border-purple-50 hover:border-purple-200 cursor-pointer touch-target"
                onClick={() => onPlaylistClick(playlist.id)}
              >
                <div className="relative mb-3 sm:mb-4">
                  <img
                    src={playlist.thumbnail}
                    alt={playlist.title}
                    className="w-full h-28 sm:h-36 object-cover rounded-xl"
                  />
                  {playlist.isHot && (
                    <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-gradient-to-r from-orange-400 to-red-400 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-xs font-medium">
                      🔥
                    </div>
                  )}
                  <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-black/70 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    {playlist.videoCount}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl flex items-center justify-center">
                    <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors text-sm sm:text-base">
                  {playlist.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-gray-600 mb-2 gap-2">
                  <span className="flex items-center gap-1 truncate">
                    {playlist.creatorBadge} {playlist.creator}
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <Eye className="w-3 h-3" />
                    {playlist.views}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                  {playlist.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-50 text-purple-600 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0 flex-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlaylistLike(playlist.id);
                      }}
                      className="flex items-center gap-1 hover:text-red-500 transition-colors touch-target"
                    >
                      <Heart className="w-3 h-3" />
                      <span className="truncate">
                        {playlist.likes > 1000
                          ? `${(playlist.likes / 1000).toFixed(1)}K`
                          : playlist.likes.toLocaleString()}
                      </span>
                    </button>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {playlist.watchPartyCount}
                    </span>
                  </div>

                  {playlist.watchPartyCount > 0 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWatchPartyJoin(playlist.id);
                      }}
                      size="xs"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all touch-target flex-shrink-0"
                    >
                      参加
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {playlists.length === 0 && (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                プレイリストが見つかりません
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                検索条件を変更するか、新しいプレイリストを作成してみましょう。
              </p>
              <Button
                onClick={onCreatePlaylist}
                size="md"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 touch-target"
              >
                <Plus className="w-4 h-4" />
                プレイリストを作成
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

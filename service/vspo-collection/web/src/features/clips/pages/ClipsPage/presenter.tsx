import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Grid3X3,
  Heart,
  List,
  Loader2,
  MessageCircle,
  Play,
  Search,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import type { Clip } from "../../../../common/types/schemas";
import { Button } from "../../../../shared/components/presenters/Button";
import type { ClipType, Platform, SortBy, ViewMode } from "./container";

interface ExtendedClip extends Clip {
  platform: Platform;
  clipType: ClipType;
  uploadedAt: string;
}

interface ClipsPagePresenterProps {
  // Data
  clips: ExtendedClip[];
  totalClips: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  // Filters
  selectedPlatform: Platform;
  selectedType: ClipType;
  sortBy: SortBy;
  viewMode: ViewMode;
  searchQuery: string;
  // Handlers
  onPlatformChange: (platform: Platform) => void;
  onTypeChange: (type: ClipType) => void;
  onSortChange: (sort: SortBy) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
  onClipClick: (clip: ExtendedClip) => void;
  onLike: (clip: ExtendedClip) => void;
  onWatchParty: (clip: ExtendedClip) => void;
}

const platformOptions: { value: Platform; label: string; color: string }[] = [
  { value: "all", label: "すべて", color: "purple" },
  { value: "youtube", label: "YouTube", color: "red" },
  { value: "twitch", label: "Twitch", color: "purple" },
  { value: "twitcasting", label: "ツイキャス", color: "blue" },
  { value: "niconico", label: "ニコニコ", color: "gray" },
];

const typeOptions: { value: ClipType; label: string; icon: React.ReactNode }[] =
  [
    { value: "all", label: "すべて", icon: <Video className="w-4 h-4" /> },
    { value: "clips", label: "切り抜き", icon: <Video className="w-4 h-4" /> },
    { value: "shorts", label: "ショート", icon: <Clock className="w-4 h-4" /> },
  ];

const sortOptions: { value: SortBy; label: string; icon: React.ReactNode }[] = [
  {
    value: "views",
    label: "再生回数",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  { value: "recent", label: "新着順", icon: <Clock className="w-4 h-4" /> },
  { value: "likes", label: "いいね数", icon: <Heart className="w-4 h-4" /> },
];

export const ClipsPagePresenter = ({
  clips,
  totalClips,
  currentPage,
  totalPages,
  isLoading,
  selectedPlatform,
  selectedType,
  sortBy,
  viewMode,
  searchQuery,
  onPlatformChange,
  onTypeChange,
  onSortChange,
  onViewModeChange,
  onSearch,
  onPageChange,
  onClipClick,
  onLike,
  onWatchParty,
}: ClipsPagePresenterProps) => {
  const getPlatformColor = (platform: Platform): string => {
    switch (platform) {
      case "youtube":
        return "bg-red-500";
      case "twitch":
        return "bg-purple-500";
      case "twitcasting":
        return "bg-blue-500";
      case "niconico":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatUploadedAt = (date: string): string => {
    const now = new Date();
    const uploaded = new Date(date);
    const diffInDays = Math.floor(
      (now.getTime() - uploaded.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays === 0) return "今日";
    if (diffInDays === 1) return "昨日";
    if (diffInDays < 7) return `${diffInDays}日前`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}週間前`;
    return `${Math.floor(diffInDays / 30)}ヶ月前`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 safe-area-top">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            {/* Title and Stats */}
            <div className="flex items-center justify-between lg:w-auto">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                切り抜き動画
              </h1>
              <span className="text-white/70 text-xs sm:text-sm">
                {totalClips}件の動画
              </span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder="動画を検索..."
                  className="w-full px-3 sm:px-4 py-2 pr-10 rounded-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-purple-500/50 transition-all text-sm sm:text-base"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/50" />
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                onClick={() => onViewModeChange("grid")}
                variant={viewMode === "grid" ? "primary" : "ghost"}
                size="sm"
                touchFriendly
                className="flex-shrink-0"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => onViewModeChange("list")}
                variant={viewMode === "list" ? "primary" : "ghost"}
                size="sm"
                touchFriendly
                className="flex-shrink-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="sticky top-[65px] sm:top-[73px] z-10 bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:gap-4">
            {/* Platform Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/70 flex-shrink-0" />
              <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
                {platformOptions.map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => onPlatformChange(option.value)}
                    variant={
                      selectedPlatform === option.value ? "primary" : "ghost"
                    }
                    size="xs"
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
              {typeOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => onTypeChange(option.value)}
                  variant={
                    selectedType === option.value ? "secondary" : "ghost"
                  }
                  size="xs"
                  className="whitespace-nowrap flex-shrink-0"
                >
                  {option.icon}
                  <span className="hidden sm:inline">{option.label}</span>
                </Button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-1 sm:gap-2 lg:ml-auto">
              <span className="text-white/70 text-xs sm:text-sm flex-shrink-0">
                並び替え:
              </span>
              <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
                {sortOptions.map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    variant={sortBy === option.value ? "accent" : "ghost"}
                    size="xs"
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    {option.icon}
                    <span className="hidden sm:inline">{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 sm:py-20">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" />
          </div>
        ) : clips.length === 0 ? (
          <div className="text-center py-12 sm:py-20 px-4">
            <Video className="w-12 h-12 sm:w-16 sm:h-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 text-base sm:text-lg">
              動画が見つかりませんでした
            </p>
          </div>
        ) : viewMode === "grid" ? (
          // Grid View
          <div className="grid grid-cols-1 sm:grid-cols-2 tablet:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {clips.map((clip) => (
              <div
                key={clip.id}
                onClick={() => onClipClick(clip)}
                className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-white/20 active:border-white/30 transition-all cursor-pointer group touch-target"
              >
                <div className="relative aspect-video bg-gradient-to-br from-purple-500 to-pink-500">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <Play className="w-8 h-8 sm:w-12 sm:h-12 text-white opacity-80 group-hover:opacity-100 transition-all" />
                  </div>

                  {/* Platform Badge */}
                  <span
                    className={`absolute top-1 sm:top-2 left-1 sm:left-2 ${getPlatformColor(clip.platform)} text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full`}
                  >
                    {
                      platformOptions.find((p) => p.value === clip.platform)
                        ?.label
                    }
                  </span>

                  {/* Exclusive Badge */}
                  {clip.isExclusive && (
                    <span className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-purple-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      独占
                    </span>
                  )}

                  {/* Duration */}
                  <span className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-black/70 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    {clip.duration}
                  </span>

                  {/* Watch Party Badge */}
                  {clip.watchPartyActive && (
                    <span className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 bg-pink-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full animate-pulse">
                      パーティー中
                    </span>
                  )}
                </div>

                <div className="p-3 sm:p-4">
                  <h3 className="text-white font-semibold mb-2 line-clamp-2 text-sm sm:text-base">
                    {clip.title}
                  </h3>
                  <p className="text-white/70 text-xs sm:text-sm mb-1 truncate">
                    {clip.vtuber}
                  </p>
                  <p className="text-white/60 text-xs mb-2 sm:mb-3 truncate">
                    {clip.clipper} • {formatUploadedAt(clip.uploadedAt)}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 text-white/70 text-xs sm:text-sm min-w-0 flex-1">
                      <span className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        <span className="truncate">{clip.views}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span className="truncate">{clip.likes}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {clip.watchPartyActive && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onWatchParty(clip);
                          }}
                          variant="ghost"
                          size="xs"
                          touchFriendly
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLike(clip);
                        }}
                        variant="ghost"
                        size="xs"
                        touchFriendly
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-3 sm:space-y-4">
            {clips.map((clip) => (
              <div
                key={clip.id}
                onClick={() => onClipClick(clip)}
                className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 hover:border-white/20 active:border-white/30 transition-all cursor-pointer group flex gap-3 sm:gap-4 touch-target"
              >
                {/* Thumbnail */}
                <div className="relative w-32 h-18 sm:w-48 sm:h-27 flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
                    <Play className="w-6 h-6 sm:w-10 sm:h-10 text-white opacity-80 group-hover:opacity-100 transition-all" />
                  </div>
                  <span className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 bg-black/70 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded">
                    {clip.duration}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 sm:gap-4 mb-1 sm:mb-2">
                    <h3 className="text-white font-semibold line-clamp-2 text-sm sm:text-base">
                      {clip.title}
                    </h3>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      {/* Platform Badge */}
                      <span
                        className={`${getPlatformColor(clip.platform)} text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full`}
                      >
                        {
                          platformOptions.find((p) => p.value === clip.platform)
                            ?.label
                        }
                      </span>
                      {clip.isExclusive && (
                        <span className="bg-purple-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                          独占
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-white/70 text-sm mb-1">{clip.vtuber}</p>
                  <p className="text-white/60 text-xs mb-3">
                    {clip.clipper} • {formatUploadedAt(clip.uploadedAt)}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-white/70 text-sm">
                      <span className="flex items-center gap-1">
                        <Play className="w-4 h-4" />
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
                    <div className="flex items-center gap-2">
                      {clip.watchPartyActive && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onWatchParty(clip);
                          }}
                          variant="secondary"
                          size="sm"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          パーティーに参加
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLike(clip);
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="ghost"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    variant={currentPage === pageNum ? "primary" : "ghost"}
                    size="sm"
                    className="min-w-[40px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="ghost"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

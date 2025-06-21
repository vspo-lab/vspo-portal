import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Coffee,
  Eye,
  Filter,
  Gamepad2,
  Hash,
  Heart,
  List,
  Loader2,
  MessageCircle,
  Mic,
  Music,
  Paintbrush,
  Play,
  Search,
  Sparkles,
  Tag,
  TrendingUp,
  Tv,
  User,
  Users,
  Video,
  Volume2,
  X,
} from "lucide-react";
import Link from "next/link";
import { Breadcrumbs } from "../../../../shared/components/Breadcrumbs";
import { LinkPreview } from "../../../../shared/components/LinkPreview";
import { Button } from "../../../../shared/components/presenters/Button";
import { useNavigation } from "../../../navigation/hooks/useNavigation";
import type {
  PopularSearch,
  RecentSearch,
  SearchContentType,
  SearchDateRange,
  SearchFilters,
  SearchPlatform,
  SearchSortBy,
  SearchState,
  SearchSuggestion,
  SearchableClip,
  SearchablePlaylist,
  SearchableVTuber,
  SearchableWatchParty,
} from "../../types";

interface SearchPagePresenterProps {
  searchState: SearchState;
  filteredSuggestions: SearchSuggestion[];
  onSearch: (query: string) => void;
  onFilterChange: <T extends keyof SearchFilters>(
    filterType: T,
    value: SearchFilters[T],
  ) => void;
  onSuggestionClick: (suggestion: SearchSuggestion) => void;
  onRecentSearchClick: (recentSearch: RecentSearch) => void;
  onPopularSearchClick: (popularSearch: PopularSearch) => void;
  onToggleAdvancedFilters: () => void;
  onClearSearch: () => void;
}

// Content type options
const contentTypeOptions: {
  value: SearchContentType;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "all",
    label: "すべて",
    icon: <Sparkles className="w-4 h-4" />,
    color: "purple",
  },
  {
    value: "vtubers",
    label: "VTuber",
    icon: <User className="w-4 h-4" />,
    color: "pink",
  },
  {
    value: "clips",
    label: "切り抜き",
    icon: <Video className="w-4 h-4" />,
    color: "blue",
  },
  {
    value: "playlists",
    label: "プレイリスト",
    icon: <List className="w-4 h-4" />,
    color: "emerald",
  },
  {
    value: "watchparties",
    label: "ウォッチパーティー",
    icon: <Users className="w-4 h-4" />,
    color: "orange",
  },
];

// Platform options
const platformOptions: {
  value: SearchPlatform;
  label: string;
  color: string;
}[] = [
  { value: "all", label: "すべて", color: "gray" },
  { value: "youtube", label: "YouTube", color: "red" },
  { value: "twitch", label: "Twitch", color: "purple" },
  { value: "twitcasting", label: "ツイキャス", color: "blue" },
  { value: "niconico", label: "ニコニコ", color: "orange" },
  { value: "bilibili", label: "bilibili", color: "cyan" },
];

// Date range options
const dateRangeOptions: { value: SearchDateRange; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "day", label: "今日" },
  { value: "week", label: "今週" },
  { value: "month", label: "今月" },
  { value: "year", label: "今年" },
];

// Sort options
const sortOptions: {
  value: SearchSortBy;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "relevance",
    label: "関連度",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  { value: "recent", label: "新着順", icon: <Clock className="w-4 h-4" /> },
  { value: "popular", label: "人気順", icon: <Eye className="w-4 h-4" /> },
  { value: "views", label: "再生回数", icon: <Play className="w-4 h-4" /> },
  {
    value: "alphabetical",
    label: "あいうえお順",
    icon: <Hash className="w-4 h-4" />,
  },
];

// Helper functions
const formatTimeAgo = (timestamp: string): string => {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diffInMinutes = Math.floor((now - time) / (1000 * 60));

  if (diffInMinutes < 60) return `${diffInMinutes}分前`;
  if (diffInMinutes < 24 * 60) return `${Math.floor(diffInMinutes / 60)}時間前`;
  if (diffInMinutes < 7 * 24 * 60)
    return `${Math.floor(diffInMinutes / (24 * 60))}日前`;
  return new Date(timestamp).toLocaleDateString("ja-JP");
};

const getContentTypeIcon = (type: string): React.ReactNode => {
  switch (type) {
    case "vtuber":
      return <User className="w-3 h-3" />;
    case "tag":
      return <Tag className="w-3 h-3" />;
    case "category":
      return <Hash className="w-3 h-3" />;
    default:
      return <Search className="w-3 h-3" />;
  }
};

const getCategoryIcon = (category: string): React.ReactNode => {
  switch (category.toLowerCase()) {
    case "gaming":
      return <Gamepad2 className="w-4 h-4" />;
    case "music":
      return <Music className="w-4 h-4" />;
    case "asmr":
      return <Volume2 className="w-4 h-4" />;
    case "art":
      return <Paintbrush className="w-4 h-4" />;
    case "cooking":
      return <Coffee className="w-4 h-4" />;
    case "chat":
      return <MessageCircle className="w-4 h-4" />;
    default:
      return <Tv className="w-4 h-4" />;
  }
};

const getPlatformColor = (platform: SearchPlatform): string => {
  switch (platform) {
    case "youtube":
      return "bg-red-500";
    case "twitch":
      return "bg-purple-500";
    case "twitcasting":
      return "bg-blue-500";
    case "niconico":
      return "bg-orange-500";
    case "bilibili":
      return "bg-cyan-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "live":
      return "bg-red-500 animate-pulse";
    case "scheduled":
      return "bg-yellow-500";
    case "ended":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
};

// VTuber Result Component
const VTuberResult = ({ vtuber }: { vtuber: SearchableVTuber }) => {
  const vtuberHref = `/vtubers/${vtuber.id}`;

  return (
    <LinkPreview
      href={vtuberHref}
      preview={{
        title: vtuber.name,
        description: vtuber.description,
        thumbnail: vtuber.avatar,
        metadata: {
          views: vtuber.totalViews,
          creator: `${vtuber.totalClips} 動画`,
        },
      }}
    >
      <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={vtuber.avatar}
              alt={vtuber.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
            />
            {vtuber.isLive && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                LIVE
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold text-lg">
                {vtuber.name}
              </h3>
              <span
                className={"text-xs px-2 py-1 rounded-full text-white"}
                style={{ backgroundColor: vtuber.color }}
              >
                {vtuber.memberType.toUpperCase()}
              </span>
            </div>

            <p className="text-white/70 text-sm mb-3 line-clamp-2">
              {vtuber.description}
            </p>

            <div className="flex items-center gap-4 text-white/60 text-sm mb-3">
              <span className="flex items-center gap-1">
                <Video className="w-3 h-3" />
                {vtuber.totalClips}本
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {vtuber.totalViews}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {vtuber.stats?.favoriteCount}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {vtuber.platformLinks.slice(0, 3).map((link, index) => (
                  <span
                    key={index}
                    className={`${getPlatformColor(link.platform)} text-white text-xs px-2 py-1 rounded-full`}
                  >
                    {
                      platformOptions.find((p) => p.value === link.platform)
                        ?.label
                    }
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1">
                {vtuber.tags?.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="bg-white/10 text-white/70 text-xs px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </LinkPreview>
  );
};

// Clip Result Component
const ClipResult = ({ clip }: { clip: SearchableClip }) => {
  const clipHref = `/clips/${clip.id}`;

  return (
    <LinkPreview
      href={clipHref}
      preview={{
        title: clip.title,
        description: `${clip.vtuber} の切り抜き動画`,
        thumbnail: clip.thumbnail,
        metadata: {
          views: clip.views,
          duration: clip.duration,
          creator: clip.clipper,
          date: formatTimeAgo(clip.uploadedAt),
        },
      }}
    >
      <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
        <div className="relative aspect-video bg-gradient-to-br from-purple-500 to-pink-500">
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
            <Play className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 transition-all" />
          </div>

          <span
            className={`absolute top-2 left-2 ${getPlatformColor(clip.platform)} text-white text-xs px-2 py-1 rounded-full`}
          >
            {platformOptions.find((p) => p.value === clip.platform)?.label}
          </span>

          {clip.isExclusive && (
            <span className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
              独占
            </span>
          )}

          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {clip.duration}
          </span>

          {clip.watchPartyActive && (
            <span className="absolute bottom-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              パーティー中
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start gap-2 mb-2">
            {getCategoryIcon(clip.category)}
            <h3 className="text-white font-semibold line-clamp-2 flex-1">
              {clip.title}
            </h3>
          </div>

          <p className="text-white/70 text-sm mb-1">{clip.vtuber}</p>
          <p className="text-white/60 text-xs mb-3">
            {clip.clipper} • {formatTimeAgo(clip.uploadedAt)}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                {clip.views}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {clip.likes}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {clip.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="bg-white/10 text-white/70 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LinkPreview>
  );
};

// Playlist Result Component
const PlaylistResult = ({ playlist }: { playlist: SearchablePlaylist }) => {
  const playlistHref = `/playlists/${playlist.id}`;

  return (
    <LinkPreview
      href={playlistHref}
      preview={{
        title: playlist.title,
        description: playlist.description,
        thumbnail: playlist.thumbnail,
        metadata: {
          views: playlist.views,
          creator: playlist.creator,
          duration: playlist.totalDuration,
        },
      }}
    >
      <div className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
        <div className="relative aspect-video bg-gradient-to-br from-emerald-500 to-green-500">
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all flex items-center justify-center">
            <List className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 transition-all" />
          </div>

          {playlist.isHot && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              🔥 HOT
            </span>
          )}

          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {playlist.videoCount}本
          </span>

          <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {playlist.totalDuration}
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-2 mb-2">
            {getCategoryIcon(playlist.category)}
            <h3 className="text-white font-semibold line-clamp-2 flex-1">
              {playlist.title}
            </h3>
          </div>

          <p className="text-white/70 text-sm mb-1">
            {playlist.creator} {playlist.creatorBadge}
          </p>
          <p className="text-white/60 text-xs mb-3 line-clamp-2">
            {playlist.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {playlist.views}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {playlist.likes}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {playlist.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="bg-white/10 text-white/70 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </LinkPreview>
  );
};

// Watch Party Result Component
const WatchPartyResult = ({
  watchParty,
}: { watchParty: SearchableWatchParty }) => {
  const watchPartyHref = `/watch-party/${watchParty.id}`;

  return (
    <LinkPreview
      href={watchPartyHref}
      preview={{
        title: watchParty.title,
        description: watchParty.description,
        thumbnail: watchParty.thumbnail,
        metadata: {
          creator: watchParty.hostUser,
          members: watchParty.viewers,
        },
      }}
    >
      <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all cursor-pointer group">
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={watchParty.thumbnail}
              alt={watchParty.title}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <span
              className={`absolute -top-1 -right-1 ${getStatusColor(watchParty.status)} text-white text-xs px-1.5 py-0.5 rounded-full`}
            >
              {watchParty.status.toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold mb-2 line-clamp-2">
              {watchParty.title}
            </h3>

            <div className="flex items-center gap-2 mb-2">
              <img
                src={watchParty.hostAvatar}
                alt={watchParty.hostUser}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-white/70 text-sm">
                {watchParty.hostUser}
              </span>
            </div>

            <p className="text-white/60 text-xs mb-3 line-clamp-2">
              {watchParty.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white/70 text-sm">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {watchParty.viewers}人
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatTimeAgo(watchParty.startTime)}
                </span>
              </div>

              <Button variant="secondary" size="sm">
                参加する
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LinkPreview>
  );
};

export const SearchPagePresenter = ({
  searchState,
  filteredSuggestions,
  onSearch,
  onFilterChange,
  onSuggestionClick,
  onRecentSearchClick,
  onPopularSearchClick,
  onToggleAdvancedFilters,
  onClearSearch,
}: SearchPagePresenterProps) => {
  const { breadcrumbs } = useNavigation();
  const {
    query,
    filters,
    results,
    suggestions,
    recentSearches,
    popularSearches,
    isLoading,
    hasSearched,
    showAdvancedFilters,
  } = searchState;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Title and Search Bar */}
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white whitespace-nowrap">
                検索
              </h1>

              <div className="flex-1 max-w-2xl relative">
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="VTuber、動画、プレイリストを検索..."
                    className="w-full px-4 py-3 pr-12 rounded-full bg-white/10 backdrop-blur-sm text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {query && (
                      <button
                        onClick={onClearSearch}
                        className="text-white/50 hover:text-white/80 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <Search className="w-5 h-5 text-white/50" />
                  </div>
                </div>

                {/* Search Suggestions */}
                {query && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-black/80 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl z-30">
                    {filteredSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => onSuggestionClick(suggestion)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="text-white/50">
                          {getContentTypeIcon(suggestion.type)}
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {suggestion.icon && <span>{suggestion.icon}</span>}
                          <span className="text-white truncate">
                            {suggestion.text}
                          </span>
                        </div>
                        <span className="text-white/40 text-xs">
                          {suggestion.type === "vtuber"
                            ? "VTuber"
                            : suggestion.type === "tag"
                              ? "タグ"
                              : suggestion.type === "category"
                                ? "カテゴリ"
                                : "クエリ"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Breadcrumbs */}
            <Breadcrumbs
              items={breadcrumbs}
              className="bg-white/5 border-white/10"
            />

            {/* Content Type Filters */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {contentTypeOptions.map((option) => (
                <Button
                  key={option.value}
                  onClick={() => onFilterChange("contentType", option.value)}
                  variant={
                    filters.contentType === option.value ? "primary" : "ghost"
                  }
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {option.icon}
                  {option.label}
                  {results && option.value !== "all" && (
                    <span className="ml-1 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                      {option.value === "vtubers"
                        ? results.vtubers.length
                        : option.value === "clips"
                          ? results.clips.length
                          : option.value === "playlists"
                            ? results.playlists.length
                            : option.value === "watchparties"
                              ? results.watchParties.length
                              : 0}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Advanced Filters */}
      <div className="sticky top-[140px] z-10 bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Platform Filter */}
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-sm">プラットフォーム:</span>
                <select
                  value={filters.platform}
                  onChange={(e) =>
                    onFilterChange("platform", e.target.value as SearchPlatform)
                  }
                  className="bg-white/10 text-white text-sm px-3 py-1 rounded-full border border-white/20 focus:outline-none focus:border-white/40 transition-all"
                >
                  {platformOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-sm">並び替え:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    onFilterChange("sortBy", e.target.value as SearchSortBy)
                  }
                  className="bg-white/10 text-white text-sm px-3 py-1 rounded-full border border-white/20 focus:outline-none focus:border-white/40 transition-all"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <Button onClick={onToggleAdvancedFilters} variant="ghost" size="sm">
              <Filter className="w-4 h-4" />
              詳細フィルター
              {showAdvancedFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Range Filter */}
                <div>
                  <label className="text-white/70 text-sm mb-2 block">
                    期間:
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) =>
                      onFilterChange(
                        "dateRange",
                        e.target.value as SearchDateRange,
                      )
                    }
                    className="w-full bg-white/10 text-white text-sm px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:border-white/40 transition-all"
                  >
                    {dateRangeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!hasSearched ? (
          // Initial State - No Search Yet
          <div className="space-y-8">
            {/* Popular Searches */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                人気の検索
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {popularSearches.map((popular) => (
                  <button
                    key={popular.id}
                    onClick={() => onPopularSearchClick(popular)}
                    className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">
                        {popular.query}
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          popular.trend === "up"
                            ? "bg-green-400"
                            : popular.trend === "down"
                              ? "bg-red-400"
                              : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div className="text-white/60 text-xs">
                      {popular.searchCount.toLocaleString()}回検索
                      {popular.category && (
                        <span className="ml-2 bg-white/10 px-2 py-0.5 rounded-full">
                          {popular.category}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  最近の検索
                </h2>
                <div className="space-y-2">
                  {recentSearches.map((recent) => (
                    <button
                      key={recent.id}
                      onClick={() => onRecentSearchClick(recent)}
                      className="w-full bg-gradient-to-br from-purple-600/10 to-pink-600/10 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all text-left group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-white/50" />
                        <span className="text-white font-medium">
                          {recent.query}
                        </span>
                      </div>
                      <div className="text-white/60 text-sm">
                        {recent.resultCount}件 •{" "}
                        {formatTimeAgo(recent.timestamp)}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : isLoading ? (
          // Loading State
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <span className="ml-3 text-white">検索中...</span>
          </div>
        ) : !results || results.totalResults === 0 ? (
          // Empty State
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              検索結果が見つかりませんでした
            </h2>
            <p className="text-white/70 mb-6">
              「{query}」に関連する結果が見つかりませんでした。
              <br />
              検索キーワードを変更して再度お試しください。
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-medium mb-2">検索のヒント:</h3>
                <ul className="text-white/60 text-sm space-y-1">
                  <li>• より一般的なキーワードを使用してみてください</li>
                  <li>• スペルや表記を確認してください</li>
                  <li>• フィルターを変更して検索範囲を広げてください</li>
                </ul>
              </div>
              <Button onClick={onClearSearch} variant="secondary">
                検索をクリア
              </Button>
            </div>
          </div>
        ) : (
          // Results
          <div className="space-y-8">
            {/* Search Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  「{query}」の検索結果
                </h2>
                <p className="text-white/60 text-sm">
                  {results.totalResults}件の結果 ({results.searchTime}ms)
                </p>
              </div>
            </div>

            {/* VTubers Results */}
            {results.vtubers.length > 0 &&
              (filters.contentType === "all" ||
                filters.contentType === "vtubers") && (
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    VTuber ({results.vtubers.length}件)
                  </h3>
                  <div className="space-y-4">
                    {results.vtubers
                      .slice(
                        0,
                        filters.contentType === "vtubers" ? undefined : 3,
                      )
                      .map((vtuber) => (
                        <VTuberResult key={vtuber.id} vtuber={vtuber} />
                      ))}
                  </div>
                </section>
              )}

            {/* Clips Results */}
            {results.clips.length > 0 &&
              (filters.contentType === "all" ||
                filters.contentType === "clips") && (
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    切り抜き動画 ({results.clips.length}件)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {results.clips
                      .slice(0, filters.contentType === "clips" ? undefined : 8)
                      .map((clip) => (
                        <ClipResult key={clip.id} clip={clip} />
                      ))}
                  </div>
                </section>
              )}

            {/* Playlists Results */}
            {results.playlists.length > 0 &&
              (filters.contentType === "all" ||
                filters.contentType === "playlists") && (
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <List className="w-5 h-5" />
                    プレイリスト ({results.playlists.length}件)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.playlists
                      .slice(
                        0,
                        filters.contentType === "playlists" ? undefined : 6,
                      )
                      .map((playlist) => (
                        <PlaylistResult key={playlist.id} playlist={playlist} />
                      ))}
                  </div>
                </section>
              )}

            {/* Watch Parties Results */}
            {results.watchParties.length > 0 &&
              (filters.contentType === "all" ||
                filters.contentType === "watchparties") && (
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    ウォッチパーティー ({results.watchParties.length}件)
                  </h3>
                  <div className="space-y-4">
                    {results.watchParties
                      .slice(
                        0,
                        filters.contentType === "watchparties" ? undefined : 5,
                      )
                      .map((watchParty) => (
                        <WatchPartyResult
                          key={watchParty.id}
                          watchParty={watchParty}
                        />
                      ))}
                  </div>
                </section>
              )}
          </div>
        )}
      </main>
    </div>
  );
};

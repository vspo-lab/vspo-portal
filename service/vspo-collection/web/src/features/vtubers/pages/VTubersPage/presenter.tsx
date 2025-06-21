import {
  ExternalLink,
  Filter,
  Grid,
  Heart,
  MessageCircle,
  Play,
  Search,
  SortAsc,
  Users,
  VideoIcon,
  Youtube,
} from "lucide-react";
import type { Creator, MemberType } from "../../../../common/types/creator";
import { Button } from "../../../../shared/components/presenters/Button";

interface VTubersPagePresenterProps {
  vtubers: Creator[];
  memberTypeOptions: { value: MemberType | "all"; label: string }[];
  selectedMemberType: MemberType | "all";
  searchQuery: string;
  sortBy: "name" | "subscribers" | "clips" | "joined";
  onMemberTypeChange: (memberType: MemberType | "all") => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: "name" | "subscribers" | "clips" | "joined") => void;
  onVTuberClick: (vtuber: Creator) => void;
  onPlatformClick: (vtuber: Creator, platform: string) => void;
  onFavoriteToggle: (vtuber: Creator) => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case "youtube":
      return <Youtube className="w-4 h-4" />;
    case "twitter":
    case "x":
      return <MessageCircle className="w-4 h-4" />;
    case "twitch":
      return <VideoIcon className="w-4 h-4" />;
    default:
      return <ExternalLink className="w-4 h-4" />;
  }
};

const VTuberCard = ({
  vtuber,
  onVTuberClick,
  onPlatformClick,
  onFavoriteToggle,
}: {
  vtuber: Creator;
  onVTuberClick: (vtuber: Creator) => void;
  onPlatformClick: (vtuber: Creator, platform: string) => void;
  onFavoriteToggle: (vtuber: Creator) => void;
}) => {
  const memberTypeColors: Record<MemberType, string> = {
    vspo_jp: "from-pink-500 to-purple-600",
    vspo_en: "from-blue-500 to-cyan-600",
    vspo_ch: "from-red-500 to-orange-600",
    vspo_all: "from-purple-500 to-indigo-600",
    general: "from-gray-500 to-gray-600",
  };

  const mainSubscriberCount =
    vtuber.platformLinks.find((link) => link.subscriberCount)
      ?.subscriberCount || 0;

  return (
    <div className="group relative bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      {/* Background gradient based on member type */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${memberTypeColors[vtuber.memberType]} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
      />

      {/* Member type badge */}
      <div className="absolute top-3 left-3 z-10">
        <span
          className={`px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${memberTypeColors[vtuber.memberType]} text-white shadow-lg`}
        >
          {vtuber.memberType.replace("_", " ").toUpperCase()}
        </span>
      </div>

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle(vtuber);
        }}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors duration-300"
      >
        <Heart className="w-4 h-4 text-white hover:text-pink-400" />
      </button>

      {/* Main content */}
      <div className="p-6 cursor-pointer" onClick={() => onVTuberClick(vtuber)}>
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <img
              src={vtuber.avatar}
              alt={vtuber.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white/20 group-hover:border-white/40 transition-colors duration-300"
            />
            {vtuber.isActive && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white/20 animate-pulse" />
            )}
          </div>
        </div>

        {/* Name */}
        <h3 className="text-xl font-bold text-white text-center mb-2 group-hover:text-pink-300 transition-colors duration-300">
          {vtuber.name}
        </h3>

        {/* Description */}
        {vtuber.description && (
          <p className="text-white/70 text-sm text-center mb-4 line-clamp-2">
            {vtuber.description}
          </p>
        )}

        {/* Stats */}
        {vtuber.stats && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {vtuber.stats.totalClips}
              </div>
              <div className="text-xs text-white/60">クリップ数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {formatNumber(mainSubscriberCount)}
              </div>
              <div className="text-xs text-white/60">登録者数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {vtuber.stats.totalViews}
              </div>
              <div className="text-xs text-white/60">総再生回数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">
                {vtuber.stats.monthlyViewers}
              </div>
              <div className="text-xs text-white/60">月間視聴者</div>
            </div>
          </div>
        )}

        {/* Platform links */}
        <div className="flex justify-center gap-2 mb-4">
          {vtuber.platformLinks.slice(0, 4).map((link, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                onPlatformClick(vtuber, link.platform);
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-300 group/platform"
              title={`${link.platform}: ${link.handle}`}
            >
              <div className="text-white group-hover/platform:text-pink-300 transition-colors duration-300">
                {getPlatformIcon(link.platform)}
              </div>
            </button>
          ))}
        </div>

        {/* Tags */}
        {vtuber.tags && vtuber.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center">
            {vtuber.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-white/10 text-white/80 rounded-full"
              >
                {tag}
              </span>
            ))}
            {vtuber.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-white/10 text-white/60 rounded-full">
                +{vtuber.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
        <Button className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm">
          <Play className="w-4 h-4 mr-2" />
          詳細を見る
        </Button>
      </div>
    </div>
  );
};

export const VTubersPagePresenter = ({
  vtubers,
  memberTypeOptions,
  selectedMemberType,
  searchQuery,
  sortBy,
  onMemberTypeChange,
  onSearchChange,
  onSortChange,
  onVTuberClick,
  onPlatformClick,
  onFavoriteToggle,
}: VTubersPagePresenterProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
        <div className="relative z-10 px-4 py-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              VTuber一覧
            </h1>
            <p className="text-white/80 text-lg mb-8">
              お気に入りのVTuberを見つけて、最新のクリップや配信をチェックしよう！
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-white">
                  {vtubers.length}
                </div>
                <div className="text-white/60 text-sm">配信者</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {vtubers
                    .reduce((acc, v) => acc + (v.stats?.totalClips || 0), 0)
                    .toLocaleString()}
                </div>
                <div className="text-white/60 text-sm">総クリップ数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {memberTypeOptions.filter((o) => o.value !== "all").length}
                </div>
                <div className="text-white/60 text-sm">グループ</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
              <input
                type="text"
                placeholder="VTuber名、説明、タグで検索..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all duration-300"
              />
            </div>

            {/* Member Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/60" />
              <select
                value={selectedMemberType}
                onChange={(e) =>
                  onMemberTypeChange(e.target.value as MemberType | "all")
                }
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all duration-300"
              >
                {memberTypeOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-gray-800"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-white/60" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all duration-300"
              >
                <option value="name" className="bg-gray-800">
                  名前順
                </option>
                <option value="subscribers" className="bg-gray-800">
                  登録者数順
                </option>
                <option value="clips" className="bg-gray-800">
                  クリップ数順
                </option>
                <option value="joined" className="bg-gray-800">
                  参加日順
                </option>
              </select>
            </div>

            {/* View Toggle */}
            <Button className="bg-white/10 hover:bg-white/20 border-white/20">
              <Grid className="w-4 h-4 mr-2" />
              グリッド表示
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {vtubers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              該当するVTuberが見つかりませんでした
            </h3>
            <p className="text-white/60">
              検索条件を変更して再度お試しください
            </p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-6">
              <p className="text-white/80">
                <span className="font-bold text-pink-300">
                  {vtubers.length}
                </span>
                人のVTuberが見つかりました
              </p>
            </div>

            {/* VTuber grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vtubers.map((vtuber) => (
                <VTuberCard
                  key={vtuber.id}
                  vtuber={vtuber}
                  onVTuberClick={onVTuberClick}
                  onPlatformClick={onPlatformClick}
                  onFavoriteToggle={onFavoriteToggle}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

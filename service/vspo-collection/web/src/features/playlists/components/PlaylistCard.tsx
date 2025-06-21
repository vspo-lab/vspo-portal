import { Eye, Heart, Play, Users, Video } from "lucide-react";
import Link from "next/link";
import type { Playlist } from "../../../common/types/schemas";
import { LinkPreview } from "../../../shared/components/LinkPreview";

interface PlaylistCardProps {
  playlist: Playlist;
  variant?: "default" | "trending" | "compact";
  onClick?: () => void;
  onLike?: () => void;
  onWatchPartyJoin?: () => void;
  showPreview?: boolean;
  href?: string;
}

export const PlaylistCard = ({
  playlist,
  variant = "default",
  onClick,
  onLike,
  onWatchPartyJoin,
  showPreview = true,
  href,
}: PlaylistCardProps) => {
  const baseClasses =
    "group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer";

  const variantClasses = {
    default: "p-4 border border-purple-50 hover:border-purple-200",
    trending: "p-6 border border-orange-100 hover:border-orange-200",
    compact: "p-3 border border-gray-100 hover:border-gray-200",
  };

  const imageHeight = {
    default: "h-36",
    trending: "h-32",
    compact: "h-24",
  };

  const playlistHref = href || `/playlists/${playlist.id}`;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const cardContent = (
    <div
      className={`${baseClasses} ${variantClasses[variant]}`}
      onClick={handleClick}
    >
      <div className="relative mb-4">
        <img
          src={playlist.thumbnail}
          alt={playlist.title}
          className={`w-full ${imageHeight[variant]} object-cover rounded-xl`}
        />
        {playlist.isHot && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-400 to-red-400 text-white px-2 py-1 rounded-lg text-xs font-medium">
            {variant === "trending" ? "🔥 HOT" : "🔥"}
          </div>
        )}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <Video className="w-3 h-3" />
          {playlist.videoCount}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl flex items-center justify-center">
          <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
        </div>
      </div>

      <h3
        className={`font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors ${
          variant === "compact" ? "text-sm" : "text-base"
        }`}
      >
        {playlist.title}
      </h3>

      <div
        className={`flex items-center justify-between text-gray-600 mb-2 ${
          variant === "compact" ? "text-xs" : "text-sm"
        }`}
      >
        <span className="flex items-center gap-1">
          {playlist.creatorBadge} {playlist.creator}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {playlist.views}
        </span>
      </div>

      {variant !== "compact" && (
        <div className="flex flex-wrap gap-1 mb-3">
          {playlist.tags.slice(0, variant === "trending" ? 3 : 2).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div
          className={`flex items-center gap-2 text-gray-500 ${
            variant === "compact" ? "text-xs" : "text-sm"
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike?.();
            }}
            className="flex items-center gap-1 hover:text-red-500 transition-colors"
          >
            <Heart className="w-3 h-3" />
            {playlist.likes > 1000
              ? `${(playlist.likes / 1000).toFixed(1)}K`
              : playlist.likes.toLocaleString()}
          </button>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {playlist.watchPartyCount}
          </span>
        </div>

        {playlist.watchPartyCount > 0 && variant !== "compact" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWatchPartyJoin?.();
            }}
            className="text-xs px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            参加
          </button>
        )}
      </div>
    </div>
  );

  if (showPreview && !onClick) {
    return (
      <LinkPreview
        href={playlistHref}
        preview={{
          title: playlist.title,
          description: `${playlist.creator} による ${playlist.videoCount} 本の動画のプレイリスト`,
          thumbnail: playlist.thumbnail,
          metadata: {
            views: playlist.views,
            creator: playlist.creator,
            duration: `${playlist.videoCount}本`,
          },
        }}
      >
        {cardContent}
      </LinkPreview>
    );
  }

  if (onClick) {
    return cardContent;
  }

  return <Link href={playlistHref}>{cardContent}</Link>;
};

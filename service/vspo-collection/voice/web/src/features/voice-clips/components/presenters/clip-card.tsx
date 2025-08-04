import { Heart, Play } from "lucide-react";
import type {
  Category,
  Member,
  VoiceClip,
} from "../../domain/models/voice-clip.model";

interface ClipCardProps {
  clip: VoiceClip;
  member: Member;
  categories: Category[];
  size?: "normal" | "small";
  showScore?: boolean;
  isLiked?: boolean;
  isPlaying?: boolean;
  onCardClick?: () => void;
  onPlayClick?: () => void;
  onLikeClick?: () => void;
}

export function ClipCard({
  clip,
  member,
  categories,
  size = "normal",
  showScore = false,
  isLiked = false,
  isPlaying = false,
  onCardClick,
  onPlayClick,
  onLikeClick,
}: ClipCardProps) {
  return (
    <article
      className={`bg-white dark:bg-zinc-800 border border-gray-200 dark:border-amber-600/20 rounded-lg ${size === "small" ? "p-3 h-[140px]" : "p-3 md:p-4 h-[200px] md:h-[220px]"} hover:border-amber-600 dark:hover:border-amber-600/40 transition-all cursor-pointer relative shadow-sm dark:shadow-none flex flex-col`}
      onClick={onCardClick}
    >
      {showScore && "score" in clip && (
        <div className="absolute -top-2 -right-2 bg-amber-600 text-white dark:text-zinc-900 text-xs font-bold px-2 py-1 rounded-full">
          適合度{" "}
          {Math.round(
            ((clip as VoiceClip & { score?: number }).score || 0) * 10,
          )}
          %
        </div>
      )}
      <div className="flex items-start space-x-2 md:space-x-3 mb-3">
        <div
          className={`${size === "small" ? "w-8 h-8" : "w-8 h-8 md:w-10 md:h-10"} rounded-full flex items-center justify-center text-white dark:text-zinc-900 font-bold text-xs md:text-sm flex-shrink-0`}
          style={{ backgroundColor: member.color }}
        >
          {member.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium ${size === "small" ? "text-sm" : "text-sm md:text-base"} truncate text-gray-900 dark:text-amber-100`}
          >
            {clip.title}
          </h3>
          <p className="text-xs md:text-sm text-gray-600 dark:text-zinc-400 truncate">
            {member.name}
          </p>
        </div>
      </div>

      {size === "normal" && (
        <div className="mb-3 min-h-[3.5rem] max-h-[3.5rem] overflow-hidden">
          <div className="flex flex-wrap gap-1">
            {clip.categories.slice(0, 3).map((categoryId) => {
              const category = categories.find((c) => c.id === categoryId);
              return category ? (
                <span
                  key={categoryId}
                  className="inline-block px-2 py-0.5 text-[10px] md:text-xs rounded-full bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-600/30"
                >
                  {category.name}
                </span>
              ) : null;
            })}
            {clip.categories.length > 3 && (
              <span className="inline-block px-2 py-0.5 text-[10px] md:text-xs rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                +{clip.categories.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto space-y-2">
        <div className="text-xs md:text-sm text-gray-600 dark:text-zinc-500">
          <div className="flex items-center justify-between">
            <span>{clip.views.toLocaleString()} 回</span>
            <span>{clip.duration}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm text-gray-600 dark:text-zinc-500">
            {clip.likes.toLocaleString()} いいね
          </span>
          <div className="flex items-center space-x-1 md:space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayClick?.();
              }}
              className={`p-1.5 md:p-2 rounded-full transition-colors ${
                isPlaying
                  ? "bg-amber-600 text-white dark:text-zinc-900"
                  : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-amber-100 hover:bg-gray-300 dark:hover:bg-zinc-600"
              }`}
            >
              <Play
                className="w-3.5 h-3.5 md:w-4 md:h-4"
                fill={isPlaying ? "currentColor" : "none"}
              />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLikeClick?.();
              }}
              className={`p-1.5 md:p-2 rounded-full transition-colors ${
                isLiked
                  ? "bg-amber-100 dark:bg-amber-600/20 text-amber-600 dark:text-amber-500"
                  : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-amber-100 hover:bg-gray-300 dark:hover:bg-zinc-600"
              }`}
            >
              <Heart
                className="w-3.5 h-3.5 md:w-4 md:h-4"
                fill={isLiked ? "currentColor" : "none"}
              />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

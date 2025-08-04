import { TrendingUp } from "lucide-react";
import type {
  Category,
  Member,
  VoiceClip,
} from "../../domain/models/voice-clip.model";
import { ClipCard } from "./clip-card";

interface TrendingSectionProps {
  clips: VoiceClip[];
  members: Member[];
  categories: Category[];
  likedClips?: Set<number>;
  playingClipId?: number | null;
  onCardClick?: (clip: VoiceClip) => void;
  onPlayClick?: (clipId: number) => void;
  onLikeClick?: (clipId: number) => void;
}

export function TrendingSection({
  clips,
  members,
  categories,
  likedClips = new Set(),
  playingClipId = null,
  onCardClick,
  onPlayClick,
  onLikeClick,
}: TrendingSectionProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-8">
      <div className="flex items-center space-x-2 mb-4">
        <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-500" />
        <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-amber-100">
          トレンド
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {clips.map((clip, index) => {
          const member = members.find((m) => m.id === clip.memberId);
          if (!member) return null;

          return (
            <div key={clip.id} className="relative">
              <span className="absolute top-2 left-2 text-lg md:text-xl font-bold text-amber-600 dark:text-amber-600 z-10">
                #{index + 1}
              </span>
              <ClipCard
                clip={clip}
                member={member}
                categories={categories}
                isLiked={likedClips.has(clip.id)}
                isPlaying={playingClipId === clip.id}
                onCardClick={() => onCardClick?.(clip)}
                onPlayClick={() => onPlayClick?.(clip.id)}
                onLikeClick={() => onLikeClick?.(clip.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

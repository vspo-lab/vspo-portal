import { Clock } from "lucide-react";
import type {
  Category,
  Member,
  VoiceClip,
} from "../../domain/models/voice-clip.model";
import { ClipCard } from "./clip-card";

interface NewClipsSectionProps {
  clips: VoiceClip[];
  members: Member[];
  categories: Category[];
  likedClips?: Set<number>;
  playingClipId?: number | null;
  onCardClick?: (clip: VoiceClip) => void;
  onPlayClick?: (clipId: number) => void;
  onLikeClick?: (clipId: number) => void;
  getTimeAgo: (date: Date) => string;
}

export function NewClipsSection({
  clips,
  members,
  categories,
  likedClips = new Set(),
  playingClipId = null,
  onCardClick,
  onPlayClick,
  onLikeClick,
  getTimeAgo,
}: NewClipsSectionProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 mt-8 pb-12">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
        <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-amber-100">
          新着
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {clips.map((clip) => {
          const member = members.find((m) => m.id === clip.memberId);
          if (!member) return null;

          return (
            <div key={clip.id} className="relative">
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
              <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 dark:bg-zinc-900/80 rounded text-xs text-amber-600 dark:text-amber-400 shadow-sm dark:shadow-none">
                {getTimeAgo(clip.uploadedAt)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

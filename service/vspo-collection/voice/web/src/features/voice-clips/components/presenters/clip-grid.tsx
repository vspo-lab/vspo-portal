import type {
  Category,
  Member,
  VoiceClip,
} from "../../domain/models/voice-clip.model";
import { ClipCard } from "./clip-card";

interface ClipGridProps {
  clips: VoiceClip[];
  members: Member[];
  categories: Category[];
  likedClips?: Set<number>;
  playingClipId?: number | null;
  showScore?: boolean;
  onCardClick?: (clip: VoiceClip) => void;
  onPlayClick?: (clipId: number) => void;
  onLikeClick?: (clipId: number) => void;
}

export function ClipGrid({
  clips,
  members,
  categories,
  likedClips = new Set(),
  playingClipId = null,
  showScore = false,
  onCardClick,
  onPlayClick,
  onLikeClick,
}: ClipGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {clips.map((clip) => {
        const member = members.find((m) => m.id === clip.memberId);
        if (!member) return null;

        return (
          <ClipCard
            key={clip.id}
            clip={clip}
            member={member}
            categories={categories}
            showScore={showScore}
            isLiked={likedClips.has(clip.id)}
            isPlaying={playingClipId === clip.id}
            onCardClick={() => onCardClick?.(clip)}
            onPlayClick={() => onPlayClick?.(clip.id)}
            onLikeClick={() => onLikeClick?.(clip.id)}
          />
        );
      })}
    </div>
  );
}

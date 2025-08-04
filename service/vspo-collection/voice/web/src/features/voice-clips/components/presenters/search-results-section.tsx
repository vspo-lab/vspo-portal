import { Search, Sparkles, Users } from "lucide-react";
import type {
  Category,
  Member,
  SearchResult,
  VoiceClip,
} from "../../domain/models/voice-clip.model";
import { ClipGrid } from "./clip-grid";

interface SearchResultsSectionProps {
  searchTerm: string;
  searchResults: SearchResult;
  members: Member[];
  categories: Category[];
  likedClips?: Set<number>;
  playingClipId?: number | null;
  onCardClick?: (clip: VoiceClip) => void;
  onPlayClick?: (clipId: number) => void;
  onLikeClick?: (clipId: number) => void;
  onClearSearch?: () => void;
}

export function SearchResultsSection({
  searchTerm,
  searchResults,
  members,
  categories,
  likedClips = new Set(),
  playingClipId = null,
  onCardClick,
  onPlayClick,
  onLikeClick,
  onClearSearch,
}: SearchResultsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Search results header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-amber-100">
          「{searchTerm}」の検索結果
        </h2>
        <button
          type="button"
          onClick={onClearSearch}
          className="text-sm text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400"
        >
          検索をクリア
        </button>
      </div>

      {/* Exact matches */}
      {searchResults.exact.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-amber-200 mb-3 flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>検索結果 ({searchResults.exact.length}件)</span>
          </h3>
          <ClipGrid
            clips={searchResults.exact}
            members={members}
            categories={categories}
            likedClips={likedClips}
            playingClipId={playingClipId}
            showScore={true}
            onCardClick={onCardClick}
            onPlayClick={onPlayClick}
            onLikeClick={onLikeClick}
          />
        </div>
      )}

      {/* Related results */}
      {searchResults.related.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-amber-200 mb-3 flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>関連するクリップ</span>
          </h3>
          <ClipGrid
            clips={searchResults.related}
            members={members}
            categories={categories}
            likedClips={likedClips}
            playingClipId={playingClipId}
            onCardClick={onCardClick}
            onPlayClick={onPlayClick}
            onLikeClick={onLikeClick}
          />
        </div>
      )}

      {/* Recommended */}
      {searchResults.recommended.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-amber-200 mb-3 flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>同じメンバー・カテゴリのおすすめ</span>
          </h3>
          <ClipGrid
            clips={searchResults.recommended}
            members={members}
            categories={categories}
            likedClips={likedClips}
            playingClipId={playingClipId}
            onCardClick={onCardClick}
            onPlayClick={onPlayClick}
            onLikeClick={onLikeClick}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type {
  Category,
  Member,
  VoiceClip,
} from "../../domain/models/voice-clip.model";
import { useAudioPlayer } from "../../hooks/use-audio-player";
import { ClipGrid } from "../presenters/clip-grid";
import { Header } from "../presenters/header";
import { NewClipsSection } from "../presenters/new-clips-section";
import { SearchResultsSection } from "../presenters/search-results-section";
import { TrendingSection } from "../presenters/trending-section";
import { ClipDetailModal } from "./clip-detail-modal";
import { ClipRequestModal } from "./clip-request-modal";
import { SearchContainer, type SearchFilters } from "./search-container";

interface VoiceClipsClientProps {
  initialClips: VoiceClip[];
  members: Member[];
  categories: Category[];
  trendingClips: VoiceClip[];
  newClips: VoiceClip[];
}

export function VoiceClipsClient({
  initialClips,
  members,
  categories,
  trendingClips,
  newClips,
}: VoiceClipsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [likedClips, setLikedClips] = useState<Set<number>>(new Set());
  const [favoriteClips, setFavoriteClips] = useState<Set<number>>(new Set());
  const [playingClipId, setPlayingClipId] = useState<number | null>(null);
  const [selectedClip, setSelectedClip] = useState<VoiceClip | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const audioPlayer = useAudioPlayer();

  const popularSearches = [
    "おはよう",
    "ナイスプレイ",
    "笑い声",
    "歌ってみた",
    "かわいい",
  ];

  const handleSearch = (term: string, filters: SearchFilters) => {
    setSearchTerm(term);
    // In production, filters would be applied to the search
  };

  const handleLike = (clipId: number) => {
    const newLikedClips = new Set(likedClips);
    if (likedClips.has(clipId)) {
      newLikedClips.delete(clipId);
    } else {
      newLikedClips.add(clipId);
    }
    setLikedClips(newLikedClips);
  };

  const handleFavorite = (clipId: number) => {
    const newFavoriteClips = new Set(favoriteClips);
    if (favoriteClips.has(clipId)) {
      newFavoriteClips.delete(clipId);
    } else {
      newFavoriteClips.add(clipId);
    }
    setFavoriteClips(newFavoriteClips);
  };

  const handlePlay = (clipId: number) => {
    const clip = [...initialClips, ...trendingClips, ...newClips].find(
      (c) => c.id === clipId,
    );
    if (!clip) return;

    const isPlaying = audioPlayer.toggle(clip.audioUrl, clipId);
    setPlayingClipId(isPlaying ? clipId : null);
  };

  // Update playing state when audio player state changes
  useEffect(() => {
    const checkPlayingState = () => {
      const currentlyPlaying = [
        ...initialClips,
        ...trendingClips,
        ...newClips,
      ].find((clip) => audioPlayer.isPlaying(clip.id));
      setPlayingClipId(currentlyPlaying?.id || null);
    };

    const interval = setInterval(checkPlayingState, 100);
    return () => clearInterval(interval);
  }, [audioPlayer, initialClips, trendingClips, newClips]);

  const handleCardClick = (clip: VoiceClip) => {
    setSelectedClip(clip);
    setShowDetailModal(true);
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}日前`;
    if (hours > 0) return `${hours}時間前`;
    return "1時間以内";
  };

  // Simple search implementation - in production, this would be more sophisticated
  const getSearchResults = () => {
    if (!searchTerm) return { exact: [], related: [], recommended: [] };

    const lowerTerm = searchTerm.toLowerCase();
    const exact = initialClips.filter((clip) =>
      clip.title.toLowerCase().includes(lowerTerm),
    );

    return { exact, related: [], recommended: [] };
  };

  const searchResults = getSearchResults();
  const hasSearchResults = searchTerm && searchResults.exact.length > 0;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-900">
      <Header onRequestClick={() => setShowRequestModal(true)} />

      <SearchContainer
        members={members}
        categories={categories}
        popularSearches={popularSearches}
        onSearch={handleSearch}
      />

      {/* Search results */}
      {searchTerm && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          {hasSearchResults ? (
            <SearchResultsSection
              searchTerm={searchTerm}
              searchResults={searchResults}
              members={members}
              categories={categories}
              likedClips={likedClips}
              playingClipId={playingClipId}
              onCardClick={handleCardClick}
              onPlayClick={handlePlay}
              onLikeClick={handleLike}
              onClearSearch={() => setSearchTerm("")}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-900 dark:text-amber-100 mb-2">
                「{searchTerm}」に一致するクリップが見つかりませんでした
              </p>
              <p className="text-gray-600 dark:text-zinc-500 text-sm">
                他のキーワードで検索してみてください
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-4 text-sm text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400"
              >
                ホームに戻る
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main content when not searching */}
      {!searchTerm && (
        <>
          <TrendingSection
            clips={trendingClips}
            members={members}
            categories={categories}
            likedClips={likedClips}
            playingClipId={playingClipId}
            onCardClick={handleCardClick}
            onPlayClick={handlePlay}
            onLikeClick={handleLike}
          />

          <NewClipsSection
            clips={newClips}
            members={members}
            categories={categories}
            likedClips={likedClips}
            playingClipId={playingClipId}
            onCardClick={handleCardClick}
            onPlayClick={handlePlay}
            onLikeClick={handleLike}
            getTimeAgo={getTimeAgo}
          />
        </>
      )}

      {/* Modals */}
      {showDetailModal && selectedClip && (
        <ClipDetailModal
          clip={selectedClip}
          member={
            members.find((m) => m.id === selectedClip.memberId) || members[0]
          }
          categories={categories}
          isLiked={likedClips.has(selectedClip.id)}
          isFavorite={favoriteClips.has(selectedClip.id)}
          isPlaying={playingClipId === selectedClip.id}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedClip(null);
          }}
          onPlay={() => handlePlay(selectedClip.id)}
          onLike={() => handleLike(selectedClip.id)}
          onFavorite={() => handleFavorite(selectedClip.id)}
        />
      )}

      {showRequestModal && (
        <ClipRequestModal
          onClose={() => setShowRequestModal(false)}
          onSubmit={(data) => {
            console.log("Request submitted:", data);
            setShowRequestModal(false);
          }}
        />
      )}
    </div>
  );
}

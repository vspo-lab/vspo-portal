"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Playlist } from "../../../../common/types/schemas";
import { useSparkleEffect } from "../../../../shared/hooks/useSparkleEffect";
import { useUserProfile } from "../../../user/hooks/useUserProfile";
import type { PlaylistVideo } from "../../types";
import { PlaylistDetailPagePresenter } from "./presenter";

interface PlaylistDetailPageContainerProps {
  playlist: Playlist;
  relatedPlaylists: Playlist[];
  recommendedPlaylists: Playlist[];
  autoplay?: boolean;
  startIndex?: number;
}

export const PlaylistDetailPageContainer = ({
  playlist,
  relatedPlaylists,
  recommendedPlaylists,
  autoplay = false,
  startIndex = 0,
}: PlaylistDetailPageContainerProps) => {
  const router = useRouter();
  const { userProfile, addPoints } = useUserProfile();
  const { sparkles, addSparkles } = useSparkleEffect();

  // Local state to manage playlist interactions
  const [isFollowing, setIsFollowing] = useState(false);
  const [queue, setQueue] = useState<PlaylistVideo[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showVideoDetails, setShowVideoDetails] = useState<number | null>(null);

  // Event handlers
  const handleBack = () => {
    router.back();
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    addSparkles([
      { x: Math.random() * 100, y: Math.random() * 100 },
      { x: Math.random() * 100, y: Math.random() * 100 },
    ]);
    addPoints(isFollowing ? -5 : 10);
  };

  const handlePlayPlaylist = () => {
    if (playlist && playlist.videoCount > 0) {
      setIsPlaying(true);
      setCurrentVideoIndex(startIndex);
      addPoints(15);
      addSparkles([
        { x: 50, y: 50 },
        { x: 60, y: 45 },
        { x: 40, y: 55 },
      ]);
      alert(
        `🎵 プレイリスト再生開始！\n\n"${playlist.title}"\n\n+15ポイント獲得！`,
      );
    }
  };

  const handleVideoPlay = (video: PlaylistVideo, index: number) => {
    setCurrentVideoIndex(index);
    setIsPlaying(true);
    addPoints(5);
    alert(`▶️ 動画を再生\n\n"${video.title}"\n\n+5ポイント獲得！`);
  };

  const handleVideoLike = (videoId: number) => {
    // In a real app, would update like status for specific video
    console.log("Liking video:", videoId);
    addSparkles([{ x: Math.random() * 100, y: Math.random() * 100 }]);
    addPoints(3);
    alert("💕 いいね！しました\n\n+3ポイント獲得！");
  };

  const handleAddToQueue = (video: PlaylistVideo) => {
    setQueue((prev) => [...prev, video]);
    addPoints(5);
    alert(`📋 キューに追加しました\n\n"${video.title}"\n\n+5ポイント獲得！`);
  };

  const handleRemoveVideo = (videoId: number) => {
    const confirmed = confirm("この動画をプレイリストから削除しますか？");
    if (confirmed) {
      // In a real app, this would make an API call to remove the video
      console.log("Removing video:", videoId);
      addPoints(2);
      alert("🗑️ 動画を削除しました\n\n+2ポイント獲得！");
    }
  };

  const handleVideoDetailsToggle = (videoId: number) => {
    setShowVideoDetails(showVideoDetails === videoId ? null : videoId);
  };

  const handleSharePlaylist = () => {
    if (playlist) {
      addPoints(10);
      alert(
        `📤 プレイリストを共有しました！\n\n"${playlist.title}"\n\n+10ポイント獲得！`,
      );
    }
  };

  const handleWatchPartyCreate = () => {
    if (playlist) {
      addPoints(25);
      alert(
        `🎉 ウォッチパーティを作成しました！\n\n"${playlist.title}"\n\nルームコード: ${Math.random().toString(36).substr(2, 8).toUpperCase()}\n\n+25ポイント獲得！`,
      );
    }
  };

  const handleNext = () => {
    if (playlist && currentVideoIndex < playlist.videoCount - 1) {
      const nextIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(nextIndex);
      addPoints(2);
      alert(`⏭️ 次の動画\n\n動画 ${nextIndex + 1}`);
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      const prevIndex = currentVideoIndex - 1;
      setCurrentVideoIndex(prevIndex);
      addPoints(2);
      alert(`⏮️ 前の動画\n\n動画 ${prevIndex + 1}`);
    }
  };

  const handleShuffle = () => {
    if (playlist && playlist.videoCount > 1) {
      const randomIndex = Math.floor(Math.random() * playlist.videoCount);
      setCurrentVideoIndex(randomIndex);
      addPoints(5);
      alert(`🔀 シャッフル再生\n\n動画 ${randomIndex + 1}\n\n+5ポイント獲得！`);
    }
  };

  return (
    <PlaylistDetailPagePresenter
      // State
      playlist={playlist}
      relatedPlaylists={relatedPlaylists}
      recommendedPlaylists={recommendedPlaylists}
      isLoading={isLoading}
      error={error}
      userProfile={userProfile}
      sparkles={sparkles}
      isPlaying={isPlaying}
      currentVideoIndex={currentVideoIndex}
      showVideoDetails={showVideoDetails}
      isFollowing={isFollowing}
      autoplay={autoplay}
      // Event handlers
      onBack={handleBack}
      onFollowToggle={handleFollowToggle}
      onPlayPlaylist={handlePlayPlaylist}
      onVideoPlay={handleVideoPlay}
      onVideoLike={handleVideoLike}
      onAddToQueue={handleAddToQueue}
      onRemoveVideo={handleRemoveVideo}
      onVideoDetailsToggle={handleVideoDetailsToggle}
      onSharePlaylist={handleSharePlaylist}
      onWatchPartyCreate={handleWatchPartyCreate}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onShuffle={handleShuffle}
    />
  );
};

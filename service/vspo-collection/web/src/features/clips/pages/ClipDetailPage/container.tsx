"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Creator } from "../../../../common/types/creator";
import type { Clip } from "../../../../common/types/schemas";
import { useSparkleEffect } from "../../../../shared/hooks/useSparkleEffect";
import { useUserProfile } from "../../../user/hooks/useUserProfile";
import { ClipDetailPagePresenter } from "./presenter";

interface ClipDetailPageContainerProps {
  clip: Clip & { url: string; description?: string; tags: string[] };
  vtuber: Creator | null;
  relatedClips: Clip[];
  recommendedClips: Clip[];
  autoplay?: boolean;
  startTime?: number;
}

export const ClipDetailPageContainer = ({
  clip,
  vtuber,
  relatedClips,
  recommendedClips,
  autoplay = false,
  startTime,
}: ClipDetailPageContainerProps) => {
  const router = useRouter();
  const { userProfile, addPoints } = useUserProfile();
  const { sparkles, addSparkles } = useSparkleEffect();

  // State
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowingVTuber, setIsFollowingVTuber] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [currentTime, setCurrentTime] = useState(startTime || 0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showWatchPartyModal, setShowWatchPartyModal] = useState(false);
  const [comments, setComments] = useState([
    {
      id: 1,
      user: "VTuberファン123",
      comment: "この場面本当に面白い！",
      timestamp: "2分前",
      likes: 12,
    },
    {
      id: 2,
      user: "切り抜き好き",
      comment: "クリッパーさんありがとう！",
      timestamp: "5分前",
      likes: 8,
    },
    {
      id: 3,
      user: "推し活中",
      comment: "何回見ても笑える",
      timestamp: "10分前",
      likes: 15,
    },
  ]);
  const [newComment, setNewComment] = useState("");

  // Event handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
    addSparkles([
      { x: Math.random() * 100, y: Math.random() * 100 },
      { x: Math.random() * 100, y: Math.random() * 100 },
    ]);
    addPoints(isLiked ? -3 : 5);

    const message = isLiked
      ? "いいね！を取り消しました\n\n-3ポイント"
      : "いいね！しました\n\n+5ポイント獲得！";
    alert(message);
  }, [isLiked, addSparkles, addPoints]);

  const handleFollowVTuber = useCallback(() => {
    if (!vtuber) return;

    setIsFollowingVTuber(!isFollowingVTuber);
    addSparkles([
      { x: Math.random() * 100, y: Math.random() * 100 },
      { x: Math.random() * 100, y: Math.random() * 100 },
    ]);
    addPoints(isFollowingVTuber ? -5 : 10);

    const message = isFollowingVTuber
      ? `${vtuber.name}のフォローを解除しました\n\n-5ポイント`
      : `${vtuber.name}をフォローしました！\n\n+10ポイント獲得！`;
    alert(message);
  }, [isFollowingVTuber, vtuber, addSparkles, addPoints]);

  const handleShare = useCallback(() => {
    setShowShareModal(true);
    addPoints(5);
  }, [addPoints]);

  const handleCloseShare = useCallback(() => {
    setShowShareModal(false);
  }, []);

  const handleSharePlatform = useCallback(
    (platform: string) => {
      const url = `${window.location.origin}/clips/${clip.id}`;
      const text = `「${clip.title}」- ${clip.vtuber} | VSPO Collection`;

      switch (platform) {
        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            "_blank",
          );
          break;
        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            "_blank",
          );
          break;
        case "line":
          window.open(
            `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
            "_blank",
          );
          break;
        case "copy":
          navigator.clipboard.writeText(url);
          alert("URLをコピーしました！");
          break;
      }

      addPoints(3);
      addSparkles([{ x: 50, y: 50 }]);
      setShowShareModal(false);
    },
    [clip.id, clip.title, clip.vtuber, addPoints, addSparkles],
  );

  const handleAddToPlaylist = useCallback(() => {
    addSparkles([
      { x: Math.random() * 100, y: Math.random() * 100 },
      { x: Math.random() * 100, y: Math.random() * 100 },
    ]);
    addPoints(10);
    alert(
      `📋 「${clip.title}」をプレイリストに追加しました！\n\n+10ポイント獲得！`,
    );
  }, [clip.title, addSparkles, addPoints]);

  const handleCreateWatchParty = useCallback(() => {
    setShowWatchPartyModal(true);
  }, []);

  const handleCloseWatchParty = useCallback(() => {
    setShowWatchPartyModal(false);
  }, []);

  const handleStartWatchParty = useCallback(() => {
    addSparkles([
      { x: 25, y: 25 },
      { x: 75, y: 25 },
      { x: 50, y: 75 },
    ]);
    addPoints(25);

    // Generate a random room code
    const roomCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    alert(
      `🎉 ウォッチパーティを作成しました！\n\n「${clip.title}」\n\nルームコード: ${roomCode}\n\n+25ポイント獲得！`,
    );

    setShowWatchPartyModal(false);
    router.push(`/watch-party/clip-${clip.id}?room=${roomCode}`);
  }, [clip.id, clip.title, addSparkles, addPoints, router]);

  const handleJoinWatchParty = useCallback(() => {
    if (!clip.watchPartyActive) return;

    addSparkles([
      { x: Math.random() * 100, y: Math.random() * 100 },
      { x: Math.random() * 100, y: Math.random() * 100 },
    ]);
    addPoints(15);
    router.push(`/watch-party/clip-${clip.id}`);
  }, [clip.id, clip.watchPartyActive, addSparkles, addPoints, router]);

  const handleRelatedClipClick = useCallback(
    (relatedClip: Clip) => {
      router.push(`/clips/${relatedClip.id}`);
    },
    [router],
  );

  const handleVTuberClick = useCallback(() => {
    if (!vtuber) return;
    router.push(`/vtubers/${vtuber.id}`);
  }, [vtuber, router]);

  const handlePlayStateChange = useCallback(
    (playing: boolean) => {
      setIsPlaying(playing);
      if (playing) {
        addPoints(2);
      }
    },
    [addPoints],
  );

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return;

    const comment = {
      id: comments.length + 1,
      user: userProfile?.username || "匿名ユーザー",
      comment: newComment.trim(),
      timestamp: "今",
      likes: 0,
    };

    setComments((prev) => [comment, ...prev]);
    setNewComment("");
    addPoints(5);
    addSparkles([{ x: Math.random() * 100, y: Math.random() * 100 }]);
    alert("コメントを投稿しました！\n\n+5ポイント獲得！");
  }, [newComment, comments.length, userProfile, addPoints, addSparkles]);

  const handleCommentLike = useCallback(
    (commentId: number) => {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, likes: comment.likes + 1 }
            : comment,
        ),
      );
      addPoints(1);
    },
    [addPoints],
  );

  // Auto-play effect
  useEffect(() => {
    if (autoplay) {
      setIsPlaying(true);
      addPoints(5);
    }
  }, [autoplay, addPoints]);

  return (
    <ClipDetailPagePresenter
      // Data
      clip={clip}
      vtuber={vtuber}
      relatedClips={relatedClips}
      recommendedClips={recommendedClips}
      userProfile={userProfile}
      sparkles={sparkles}
      comments={comments}
      // State
      isLiked={isLiked}
      isFollowingVTuber={isFollowingVTuber}
      isPlaying={isPlaying}
      currentTime={currentTime}
      showShareModal={showShareModal}
      showWatchPartyModal={showWatchPartyModal}
      newComment={newComment}
      // Event handlers
      onBack={handleBack}
      onLike={handleLike}
      onFollowVTuber={handleFollowVTuber}
      onShare={handleShare}
      onCloseShare={handleCloseShare}
      onSharePlatform={handleSharePlatform}
      onAddToPlaylist={handleAddToPlaylist}
      onCreateWatchParty={handleCreateWatchParty}
      onCloseWatchParty={handleCloseWatchParty}
      onStartWatchParty={handleStartWatchParty}
      onJoinWatchParty={handleJoinWatchParty}
      onRelatedClipClick={handleRelatedClipClick}
      onVTuberClick={handleVTuberClick}
      onPlayStateChange={handlePlayStateChange}
      onTimeUpdate={handleTimeUpdate}
      onNewCommentChange={setNewComment}
      onAddComment={handleAddComment}
      onCommentLike={handleCommentLike}
    />
  );
};

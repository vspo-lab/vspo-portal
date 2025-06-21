"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { Creator } from "../../../../common/types/creator";
import type { Clip } from "../../../../common/types/schemas";
import { useSparkleEffect } from "../../../../shared/hooks/useSparkleEffect";
import { useUserProfile } from "../../../user/hooks/useUserProfile";
import { VTuberDetailPagePresenter } from "./presenter";

interface VTuberDetailPageContainerProps {
  vtuber: Creator;
  clips: Clip[];
  trendingClips: Clip[];
  totalClips: number;
  initialActiveTab?: string;
  initialSortBy?: string;
}

export const VTuberDetailPageContainer = ({
  vtuber,
  clips,
  trendingClips,
  totalClips,
  initialActiveTab = "clips",
  initialSortBy = "latest",
}: VTuberDetailPageContainerProps) => {
  const router = useRouter();
  const { userProfile, addPoints } = useUserProfile();
  const { sparkles, addSparkles } = useSparkleEffect();

  // State
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  // Event handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleFollow = useCallback(() => {
    setIsFollowing(!isFollowing);
    addSparkles([
      { x: Math.random() * 100, y: Math.random() * 100 },
      { x: Math.random() * 100, y: Math.random() * 100 },
    ]);
    addPoints(isFollowing ? -5 : 10);

    const message = isFollowing
      ? `${vtuber.name}のフォローを解除しました\n\n-5ポイント`
      : `${vtuber.name}をフォローしました！\n\n+10ポイント獲得！`;
    alert(message);
  }, [isFollowing, vtuber.name, addSparkles, addPoints]);

  const handleShare = useCallback(() => {
    setShowShareModal(true);
    addPoints(5);
  }, [addPoints]);

  const handleCloseShare = useCallback(() => {
    setShowShareModal(false);
  }, []);

  const handleSharePlatform = useCallback(
    (platform: string) => {
      const url = `${window.location.origin}/vtubers/${vtuber.id}`;
      const text = `${vtuber.name}の切り抜き動画をチェック！ - VSPO Collection`;

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
    [vtuber.id, vtuber.name, addPoints, addSparkles],
  );

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    // Update URL without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    // Update URL without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set("sort", sort);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleClipClick = useCallback(
    (clip: Clip) => {
      router.push(`/clips/${clip.id}`);
    },
    [router],
  );

  const handleClipLike = useCallback(
    (clip: Clip) => {
      addSparkles([{ x: Math.random() * 100, y: Math.random() * 100 }]);
      addPoints(3);
      alert(`💕 "${clip.title}"にいいね！しました\n\n+3ポイント獲得！`);
    },
    [addSparkles, addPoints],
  );

  const handleClipShare = useCallback(
    (clip: Clip) => {
      setSelectedClip(clip);
      setShowShareModal(true);
      addPoints(2);
    },
    [addPoints],
  );

  const handleWatchPartyJoin = useCallback(
    (clip: Clip) => {
      addSparkles([
        { x: 25, y: 25 },
        { x: 75, y: 25 },
        { x: 50, y: 75 },
      ]);
      addPoints(15);
      router.push(`/watch-party/clip-${clip.id}`);
    },
    [addSparkles, addPoints, router],
  );

  const handleCreatePlaylist = useCallback(() => {
    addSparkles([
      { x: Math.random() * 100, y: Math.random() * 100 },
      { x: Math.random() * 100, y: Math.random() * 100 },
      { x: Math.random() * 100, y: Math.random() * 100 },
    ]);
    addPoints(20);
    alert(
      `📋 ${vtuber.name}のプレイリストを作成しました！\n\n+20ポイント獲得！`,
    );
  }, [vtuber.name, addSparkles, addPoints]);

  const handleSubscribeToUpdates = useCallback(() => {
    addSparkles([{ x: 50, y: 50 }]);
    addPoints(10);
    alert(`🔔 ${vtuber.name}の新着通知をオンにしました！\n\n+10ポイント獲得！`);
  }, [vtuber.name, addSparkles, addPoints]);

  return (
    <VTuberDetailPagePresenter
      // Data
      vtuber={vtuber}
      clips={clips}
      trendingClips={trendingClips}
      totalClips={totalClips}
      userProfile={userProfile}
      sparkles={sparkles}
      // State
      activeTab={activeTab}
      sortBy={sortBy}
      isFollowing={isFollowing}
      showShareModal={showShareModal}
      selectedClip={selectedClip}
      // Event handlers
      onBack={handleBack}
      onFollow={handleFollow}
      onShare={handleShare}
      onCloseShare={handleCloseShare}
      onSharePlatform={handleSharePlatform}
      onTabChange={handleTabChange}
      onSortChange={handleSortChange}
      onClipClick={handleClipClick}
      onClipLike={handleClipLike}
      onClipShare={handleClipShare}
      onWatchPartyJoin={handleWatchPartyJoin}
      onCreatePlaylist={handleCreatePlaylist}
      onSubscribeToUpdates={handleSubscribeToUpdates}
    />
  );
};

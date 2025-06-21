"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Clip } from "../../../../common/types/schemas";
import type { WatchPartyDetail } from "../../../../lib/services/watchPartyService";
import { useSparkleEffect } from "../../../../shared/hooks/useSparkleEffect";
import { useUserProfile } from "../../../user/hooks/useUserProfile";
import { WatchPartyDetailPagePresenter } from "./presenter";

interface WatchPartyDetailPageContainerProps {
  watchParty: WatchPartyDetail | any; // Using any for now to accommodate our custom structure
  clip: (Clip & { url: string; description?: string; tags: string[] }) | null;
  relatedClips: Clip[];
  roomCode: string | null;
  joinAsGuest: boolean;
}

export const WatchPartyDetailPageContainer = ({
  watchParty,
  clip,
  relatedClips,
  roomCode,
  joinAsGuest,
}: WatchPartyDetailPageContainerProps) => {
  const router = useRouter();
  const { userProfile, addPoints } = useUserProfile();
  const { sparkles, addSparkles } = useSparkleEffect();

  // State
  const [isJoined, setIsJoined] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [chatMessages, setChatMessages] = useState(
    watchParty.chatHistory || [
      {
        id: "1",
        userId: "host",
        username: watchParty.hostName || "ホスト",
        message: "ウォッチパーティへようこそ！みんなで楽しく視聴しましょう！",
        timestamp: new Date().toISOString(),
        type: "system",
      },
    ],
  );
  const [newMessage, setNewMessage] = useState("");
  const [participants, setParticipants] = useState(
    watchParty.participants || [
      {
        id: "host",
        username: watchParty.hostName || "ホスト",
        avatar: "/placeholder.svg?height=32&width=32",
        joinedAt: new Date().toISOString(),
        isHost: true,
        isModerator: true,
      },
    ],
  );
  const [reactions, setReactions] = useState<{ [key: string]: number }>({
    "👍": 0,
    "❤️": 0,
    "😂": 0,
    "😮": 0,
    "👏": 0,
  });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Join watch party on mount if room code is provided
  useEffect(() => {
    if (roomCode && !isJoined) {
      handleJoinParty();
    }
  }, [roomCode]);

  // Event handlers
  const handleBack = useCallback(() => {
    if (isJoined) {
      handleLeaveParty();
    }
    router.back();
  }, [isJoined, router]);

  const handleJoinParty = useCallback(() => {
    setIsJoined(true);
    addSparkles([
      { x: 25, y: 25 },
      { x: 75, y: 25 },
      { x: 50, y: 75 },
    ]);
    addPoints(15);

    // Add user to participants
    const newParticipant = {
      id: `user_${Date.now()}`,
      username: userProfile?.username || "ゲスト",
      avatar: "/placeholder.svg?height=32&width=32",
      joinedAt: new Date().toISOString(),
      isHost: false,
      isModerator: false,
    };
    setParticipants((prev) => [...prev, newParticipant]);

    // Add system message
    const joinMessage = {
      id: `msg_${Date.now()}`,
      userId: "system",
      username: "システム",
      message: `${userProfile?.name || "ゲスト"}さんが参加しました！`,
      timestamp: new Date().toISOString(),
      type: "system" as const,
    };
    setChatMessages((prev) => [...prev, joinMessage]);

    alert("🎉 ウォッチパーティに参加しました！\n\n+15ポイント獲得！");
  }, [userProfile, addSparkles, addPoints]);

  const handleLeaveParty = useCallback(() => {
    setIsJoined(false);
    addPoints(5);

    // Remove user from participants
    setParticipants((prev) =>
      prev.filter((p) => p.username !== (userProfile?.name || "ゲスト")),
    );

    alert("ウォッチパーティから退出しました\n\n+5ポイント獲得！");
  }, [userProfile, addPoints]);

  const handlePlayPause = useCallback(() => {
    setIsVideoPlaying(!isVideoPlaying);
    addPoints(2);

    // Broadcast play/pause state to other users (mock)
    const playMessage = {
      id: `msg_${Date.now()}`,
      userId: "system",
      username: "システム",
      message: `${userProfile?.name || "ユーザー"}が動画を${isVideoPlaying ? "一時停止" : "再生"}しました`,
      timestamp: new Date().toISOString(),
      type: "system" as const,
    };
    setChatMessages((prev) => [...prev, playMessage]);
  }, [isVideoPlaying, userProfile, addPoints]);

  const handleTimeSeek = useCallback(
    (time: number) => {
      setCurrentTime(time);
      addPoints(1);
    },
    [addPoints],
  );

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !isJoined) return;

    const message = {
      id: `msg_${Date.now()}`,
      userId: userProfile?.id || `user_${Date.now()}`,
      username: userProfile?.username || "ゲスト",
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: "message" as const,
    };

    setChatMessages((prev) => [...prev, message]);
    setNewMessage("");
    addPoints(3);
    addSparkles([{ x: Math.random() * 100, y: Math.random() * 100 }]);
  }, [newMessage, isJoined, userProfile, addPoints, addSparkles]);

  const handleReaction = useCallback(
    (emoji: string) => {
      if (!isJoined) return;

      setReactions((prev) => ({
        ...prev,
        [emoji]: (prev[emoji] || 0) + 1,
      }));

      addSparkles([
        { x: Math.random() * 100, y: Math.random() * 100 },
        { x: Math.random() * 100, y: Math.random() * 100 },
      ]);
      addPoints(2);

      // Add reaction message
      const reactionMessage = {
        id: `msg_${Date.now()}`,
        userId: userProfile?.id || `user_${Date.now()}`,
        username: userProfile?.username || "ゲスト",
        message: `${emoji}`,
        timestamp: new Date().toISOString(),
        type: "emoji" as const,
      };
      setChatMessages((prev) => [...prev, reactionMessage]);
    },
    [isJoined, userProfile, addSparkles, addPoints],
  );

  const handleInviteFriends = useCallback(() => {
    setShowInviteModal(true);
    addPoints(5);
  }, [addPoints]);

  const handleCloseInvite = useCallback(() => {
    setShowInviteModal(false);
  }, []);

  const handleCopyInviteLink = useCallback(() => {
    const inviteUrl = `${window.location.origin}/watch-party/${watchParty.id}?room=${watchParty.roomCode || roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    addSparkles([{ x: 50, y: 50 }]);
    addPoints(3);
    alert("招待リンクをコピーしました！");
    setShowInviteModal(false);
  }, [watchParty.id, watchParty.roomCode, roomCode, addSparkles, addPoints]);

  const handleShareInvite = useCallback(
    (platform: string) => {
      const inviteUrl = `${window.location.origin}/watch-party/${watchParty.id}?room=${watchParty.roomCode || roomCode}`;
      const text = `「${watchParty.title}」のウォッチパーティに参加しませんか？一緒に楽しく視聴しましょう！`;

      switch (platform) {
        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(inviteUrl)}`,
            "_blank",
          );
          break;
        case "line":
          window.open(
            `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(inviteUrl)}`,
            "_blank",
          );
          break;
        case "discord":
          navigator.clipboard.writeText(`${text}\n${inviteUrl}`);
          alert("Discordで共有するための文章をコピーしました！");
          break;
      }

      addPoints(5);
      addSparkles([{ x: 50, y: 50 }]);
      setShowInviteModal(false);
    },
    [
      watchParty.id,
      watchParty.title,
      watchParty.roomCode,
      roomCode,
      addPoints,
      addSparkles,
    ],
  );

  const handleShowSettings = useCallback(() => {
    setShowSettingsModal(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettingsModal(false);
  }, []);

  const handleRelatedClipClick = useCallback(
    (relatedClip: Clip) => {
      router.push(`/clips/${relatedClip.id}`);
    },
    [router],
  );

  const handleCreateNewParty = useCallback(() => {
    router.push("/watch-party/create");
  }, [router]);

  // Mock real-time updates
  useEffect(() => {
    if (!isJoined) return;

    const interval = setInterval(() => {
      // Simulate other users joining/chatting
      if (Math.random() < 0.1) {
        // 10% chance every 5 seconds
        const randomUsers = [
          "VTuberファン",
          "アニメ好き",
          "推し活中",
          "夜更かし組",
        ];
        const randomMessages = [
          "この場面すき！",
          "草",
          "いいね〜",
          "みんなで見ると楽しいね",
          "最高",
        ];

        const randomMessage = {
          id: `msg_${Date.now()}_${Math.random()}`,
          userId: `user_${Math.random()}`,
          username: randomUsers[Math.floor(Math.random() * randomUsers.length)],
          message:
            randomMessages[Math.floor(Math.random() * randomMessages.length)],
          timestamp: new Date().toISOString(),
          type: "message" as const,
        };

        setChatMessages((prev) => [...prev, randomMessage]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isJoined]);

  return (
    <WatchPartyDetailPagePresenter
      // Data
      watchParty={watchParty}
      clip={clip}
      relatedClips={relatedClips}
      userProfile={userProfile}
      sparkles={sparkles}
      chatMessages={chatMessages}
      participants={participants}
      reactions={reactions}
      // State
      isJoined={isJoined}
      isVideoPlaying={isVideoPlaying}
      currentTime={currentTime}
      newMessage={newMessage}
      showInviteModal={showInviteModal}
      showSettingsModal={showSettingsModal}
      // Event handlers
      onBack={handleBack}
      onJoinParty={handleJoinParty}
      onLeaveParty={handleLeaveParty}
      onPlayPause={handlePlayPause}
      onTimeSeek={handleTimeSeek}
      onNewMessageChange={setNewMessage}
      onSendMessage={handleSendMessage}
      onReaction={handleReaction}
      onInviteFriends={handleInviteFriends}
      onCloseInvite={handleCloseInvite}
      onCopyInviteLink={handleCopyInviteLink}
      onShareInvite={handleShareInvite}
      onShowSettings={handleShowSettings}
      onCloseSettings={handleCloseSettings}
      onRelatedClipClick={handleRelatedClipClick}
      onCreateNewParty={handleCreateNewParty}
    />
  );
};

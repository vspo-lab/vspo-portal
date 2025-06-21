"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Clip } from "../../../../common/types/schemas";
import type { WatchPartyDetail } from "../../../../lib/services/watchPartyService";
import { useSparkleEffect } from "../../../../shared/hooks/useSparkleEffect";
import { useUserProfile } from "../../../user/hooks/useUserProfile";
import { WatchPartySyncProvider, useWatchPartySync } from "../../contexts/WatchPartySyncContext";
import type { WatchPartyRoom, WatchPartyVideo } from "../../types";
import { WatchPartyDetailPagePresenter } from "./presenter";

interface WatchPartyDetailPageContainerProps {
  watchParty: WatchPartyDetail | any;
  clip: (Clip & { url: string; description?: string; tags: string[] }) | null;
  relatedClips: Clip[];
  roomCode: string | null;
  joinAsGuest: boolean;
}

// Inner container that uses the sync context
const WatchPartySyncContainer = ({
  watchParty,
  clip,
  relatedClips,
  roomCode,
}: WatchPartyDetailPageContainerProps) => {
  const router = useRouter();
  const { userProfile, addPoints } = useUserProfile();
  const { sparkles, addSparkles } = useSparkleEffect();
  
  const {
    room,
    isConnected,
    isHost,
    isModerator,
    playbackState,
    viewers,
    chatMessages,
    reactions,
    joinRoom,
    leaveRoom,
    play,
    pause,
    seek,
    changeVideo,
    sendMessage,
    sendReaction,
    kickViewer,
    lastSyncTime,
    syncDelay,
  } = useWatchPartySync();

  // State
  const [isJoined, setIsJoined] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Transform room data for compatibility
  const transformedWatchParty = {
    ...watchParty,
    participants: viewers.length,
    currentViewers: viewers.length,
    isLive: isConnected && playbackState?.isPlaying,
  };

  // Transform participants
  const participants = viewers.map(viewer => ({
    id: viewer.id,
    username: viewer.name,
    avatar: viewer.avatarUrl || "/placeholder.svg?height=32&width=32",
    joinedAt: viewer.joinedAt.toString(),
    isHost: viewer.role === "host",
    isModerator: viewer.role === "moderator" || viewer.role === "host",
  }));

  // Transform chat messages
  const formattedChatMessages = chatMessages.map(msg => ({
    id: msg.id,
    userId: msg.userId,
    username: msg.userName,
    message: msg.content,
    timestamp: msg.timestamp.toString(),
    type: "message" as const,
  }));

  // Transform reactions
  const reactionCounts = reactions.reduce((acc, reaction) => {
    const emoji = {
      heart: "❤️",
      laugh: "😂",
      wow: "😮",
      fire: "🔥",
      clap: "👏",
    }[reaction.type] || "👍";
    
    acc[emoji] = (acc[emoji] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Join room on mount
  useEffect(() => {
    if (!isJoined && roomCode) {
      handleJoinParty();
    }
  }, [roomCode]);

  // Event handlers
  const handleJoinParty = useCallback(async () => {
    if (!userProfile) return;

    // Create room data for sync
    const roomData: Partial<WatchPartyRoom> = {
      id: watchParty.id,
      name: watchParty.title,
      description: watchParty.description || "",
      hostId: watchParty.hostUser || "host",
      settings: {
        name: watchParty.title,
        description: watchParty.description || "",
        maxViewers: 100,
        isPrivate: false,
        allowChat: true,
        autoSync: true,
        syncInterval: 5000,
        moderators: [],
        bannedUsers: [],
      },
      currentVideo: clip ? {
        id: clip.id,
        title: clip.title,
        channelName: clip.vtuber,
        thumbnailUrl: clip.thumbnail,
        platform: "youtube",
        duration: parseInt(clip.duration) || 0,
        currentTime: 0,
      } : null,
      currentTimestamp: 0,
      playbackState: "paused",
      viewers: [],
      isPlaying: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await joinRoom(watchParty.id, userProfile.id, roomData);
    setIsJoined(true);
    addSparkles([
      { x: 25, y: 25 },
      { x: 75, y: 25 },
      { x: 50, y: 75 },
    ]);
    addPoints(15);
  }, [watchParty, clip, userProfile, joinRoom, addSparkles, addPoints]);

  const handleLeaveParty = useCallback(async () => {
    await leaveRoom();
    setIsJoined(false);
    addPoints(5);
    router.push("/watch-party");
  }, [leaveRoom, addPoints, router]);

  const handlePlayPause = useCallback(() => {
    if (!isModerator) return;
    
    if (playbackState?.isPlaying) {
      pause();
    } else {
      play();
    }
    addPoints(2);
  }, [playbackState, isModerator, play, pause, addPoints]);

  const handleTimeSeek = useCallback((time: number) => {
    if (!isModerator) return;
    seek(time);
    addPoints(1);
  }, [isModerator, seek, addPoints]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !isJoined) return;
    
    sendMessage(newMessage.trim());
    setNewMessage("");
    addPoints(3);
    addSparkles([{ x: Math.random() * 100, y: Math.random() * 100 }]);
  }, [newMessage, isJoined, sendMessage, addPoints, addSparkles]);

  const handleReaction = useCallback((emoji: string) => {
    if (!isJoined) return;
    
    const reactionType = {
      "❤️": "heart",
      "😂": "laugh",
      "😮": "wow",
      "🔥": "fire",
      "👏": "clap",
    }[emoji] as any || "heart";
    
    sendReaction(reactionType);
    addSparkles([
      { x: Math.random() * 100, y: Math.random() * 100 },
      { x: Math.random() * 100, y: Math.random() * 100 },
    ]);
    addPoints(2);
  }, [isJoined, sendReaction, addSparkles, addPoints]);

  const handleRelatedClipClick = useCallback((relatedClip: Clip) => {
    if (!isModerator) {
      router.push(`/clips/${relatedClip.id}`);
      return;
    }

    // Change video if moderator
    const video: WatchPartyVideo = {
      id: relatedClip.id,
      title: relatedClip.title,
      channelName: relatedClip.vtuber,
      thumbnailUrl: relatedClip.thumbnail,
      platform: "youtube",
      duration: parseInt(relatedClip.duration) || 0,
      currentTime: 0,
    };
    
    changeVideo(video);
    addPoints(5);
  }, [isModerator, changeVideo, router, addPoints]);

  const handleCopyInviteLink = useCallback(() => {
    const inviteUrl = `${window.location.origin}/watch-party/${watchParty.id}?room=${roomCode || watchParty.id}`;
    navigator.clipboard.writeText(inviteUrl);
    addSparkles([{ x: 50, y: 50 }]);
    addPoints(3);
    alert("招待リンクをコピーしました！");
    setShowInviteModal(false);
  }, [watchParty.id, roomCode, addSparkles, addPoints]);

  const handleShareInvite = useCallback((platform: string) => {
    const inviteUrl = `${window.location.origin}/watch-party/${watchParty.id}?room=${roomCode || watchParty.id}`;
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
  }, [watchParty, roomCode, addPoints, addSparkles]);

  return (
    <WatchPartyDetailPagePresenter
      // Data
      watchParty={transformedWatchParty}
      clip={clip}
      relatedClips={relatedClips}
      userProfile={userProfile}
      sparkles={sparkles}
      chatMessages={formattedChatMessages}
      participants={participants}
      reactions={reactionCounts}
      // State
      isJoined={isJoined}
      isVideoPlaying={playbackState?.isPlaying || false}
      currentTime={playbackState?.currentTime || 0}
      newMessage={newMessage}
      showInviteModal={showInviteModal}
      showSettingsModal={showSettingsModal}
      // Event handlers
      onBack={() => router.back()}
      onJoinParty={handleJoinParty}
      onLeaveParty={handleLeaveParty}
      onPlayPause={handlePlayPause}
      onTimeSeek={handleTimeSeek}
      onNewMessageChange={setNewMessage}
      onSendMessage={handleSendMessage}
      onReaction={handleReaction}
      onInviteFriends={() => {
        setShowInviteModal(true);
        addPoints(5);
      }}
      onCloseInvite={() => setShowInviteModal(false)}
      onCopyInviteLink={handleCopyInviteLink}
      onShareInvite={handleShareInvite}
      onShowSettings={() => setShowSettingsModal(true)}
      onCloseSettings={() => setShowSettingsModal(false)}
      onRelatedClipClick={handleRelatedClipClick}
      onCreateNewParty={() => router.push("/watch-party/create")}
    />
  );
};

// Wrapper component that provides the sync context
export const WatchPartyDetailPageSyncContainer = (props: WatchPartyDetailPageContainerProps) => {
  const { userProfile } = useUserProfile();
  
  if (!userProfile) {
    return <div>Loading...</div>;
  }

  return (
    <WatchPartySyncProvider
      userId={userProfile.id}
      userName={userProfile.name}
      userAvatar={userProfile.avatar}
    >
      <WatchPartySyncContainer {...props} />
    </WatchPartySyncProvider>
  );
};
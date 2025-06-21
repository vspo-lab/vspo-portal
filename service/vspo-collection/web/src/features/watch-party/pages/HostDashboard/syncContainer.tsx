"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useUserProfile } from "../../../user/hooks/useUserProfile";
import { WatchPartySyncProvider, useWatchPartySync } from "../../contexts/WatchPartySyncContext";
import { useOBSIntegration } from "../../hooks/useOBSIntegration";
import { usePlaylistManager } from "../../hooks/usePlaylistManager";
import { useRoomAnalytics } from "../../hooks/useRoomAnalytics";
import type {
  Playlist,
  RoomSettings,
  Video,
  WatchPartyRoom,
  WatchPartyVideo,
} from "../../types";
import { HostDashboardPresenter } from "./presenter";

// Inner container that uses the sync context
function HostDashboardSyncInner() {
  const router = useRouter();
  const { userProfile } = useUserProfile();
  
  const {
    room,
    isConnected,
    isHost,
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
    kickViewer,
    muteViewer,
  } = useWatchPartySync();

  const [activeTab, setActiveTab] = useState<"setup" | "control" | "analytics">("setup");
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [roomSettings, setRoomSettings] = useState<RoomSettings>({
    name: "",
    description: "",
    maxViewers: 100,
    isPrivate: false,
    allowChat: true,
    autoSync: true,
    syncInterval: 5000,
    moderators: [],
    bannedUsers: [],
  });

  const {
    playlists,
    isLoadingPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    reorderPlaylistVideos,
  } = usePlaylistManager();

  const { analytics, isLoadingAnalytics, refreshAnalytics } = useRoomAnalytics(room?.id);

  const {
    obsUrl,
    obsSettings,
    generateOBSUrl,
    updateOBSSettings,
    testOBSConnection,
  } = useOBSIntegration(room?.id);

  // Handle room creation
  const handleCreateRoom = useCallback(async () => {
    if (!roomSettings.name || !userProfile) return;
    
    setIsCreating(true);
    
    try {
      const roomData: Partial<WatchPartyRoom> = {
        id: `room-${Date.now()}`,
        name: roomSettings.name,
        description: roomSettings.description,
        hostId: userProfile.id,
        settings: roomSettings,
        currentVideo: selectedVideos.length > 0 ? {
          id: selectedVideos[0].id,
          title: selectedVideos[0].title,
          channelName: selectedVideos[0].creatorName,
          thumbnailUrl: selectedVideos[0].thumbnail,
          platform: selectedVideos[0].platform,
          duration: selectedVideos[0].duration,
          currentTime: 0,
        } : null,
        currentTimestamp: 0,
        playbackState: "paused",
        viewers: [],
        isPlaying: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await joinRoom(roomData.id!, userProfile.id, roomData);
      setActiveTab("control");
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreating(false);
    }
  }, [roomSettings, selectedVideos, userProfile, joinRoom]);

  // Handle room settings update
  const handleUpdateSettings = useCallback(async (newSettings: Partial<RoomSettings>) => {
    setRoomSettings((prev) => ({ ...prev, ...newSettings }));
    // In a real implementation, this would update the room via API
  }, []);

  // Handle playlist selection
  const handleSelectPlaylist = useCallback((playlist: Playlist | null) => {
    setSelectedPlaylist(playlist);
    if (playlist) {
      setSelectedVideos(playlist.videos);
    }
  }, []);

  // Handle video selection
  const handleToggleVideo = useCallback((video: Video) => {
    setSelectedVideos((prev) => {
      const exists = prev.find((v) => v.id === video.id);
      if (exists) {
        return prev.filter((v) => v.id !== video.id);
      }
      return [...prev, video];
    });
  }, []);

  // Handle video reordering
  const handleReorderVideos = useCallback((videos: Video[]) => {
    setSelectedVideos(videos);
    if (room && selectedPlaylist) {
      reorderPlaylistVideos(
        selectedPlaylist.id,
        videos.map((v) => v.id),
      );
    }
  }, [room, selectedPlaylist, reorderPlaylistVideos]);

  // Handle playback control
  const handlePlaybackControl = useCallback(async (
    action: "play" | "pause" | "skip" | "previous",
    timestamp?: number,
  ) => {
    if (!room || !isHost) return;

    switch (action) {
      case "play":
        play();
        break;
      case "pause":
        pause();
        break;
      case "skip":
        if (selectedVideos.length > 1) {
          const currentIndex = selectedVideos.findIndex(
            v => v.id === room.currentVideo?.id
          );
          if (currentIndex !== -1 && currentIndex < selectedVideos.length - 1) {
            const nextVideo = selectedVideos[currentIndex + 1];
            const watchPartyVideo: WatchPartyVideo = {
              id: nextVideo.id,
              title: nextVideo.title,
              channelName: nextVideo.creatorName,
              thumbnailUrl: nextVideo.thumbnail,
              platform: nextVideo.platform,
              duration: nextVideo.duration,
              currentTime: 0,
            };
            changeVideo(watchPartyVideo);
          }
        }
        break;
      case "previous":
        if (selectedVideos.length > 1) {
          const currentIndex = selectedVideos.findIndex(
            v => v.id === room.currentVideo?.id
          );
          if (currentIndex > 0) {
            const prevVideo = selectedVideos[currentIndex - 1];
            const watchPartyVideo: WatchPartyVideo = {
              id: prevVideo.id,
              title: prevVideo.title,
              channelName: prevVideo.creatorName,
              thumbnailUrl: prevVideo.thumbnail,
              platform: prevVideo.platform,
              duration: prevVideo.duration,
              currentTime: 0,
            };
            changeVideo(watchPartyVideo);
          }
        }
        break;
    }
    
    if (timestamp !== undefined) {
      seek(timestamp);
    }
  }, [room, isHost, selectedVideos, play, pause, seek, changeVideo]);

  // Handle viewer management
  const handleKickViewer = useCallback(async (viewerId: string) => {
    if (!room || !isHost) return;
    kickViewer(viewerId);
  }, [room, isHost, kickViewer]);

  const handleBanViewer = useCallback(async (viewerId: string) => {
    if (!room || !isHost) return;
    // In real implementation, this would update room settings with banned user
    kickViewer(viewerId);
    setRoomSettings(prev => ({
      ...prev,
      bannedUsers: [...prev.bannedUsers, viewerId],
    }));
  }, [room, isHost, kickViewer]);

  const handlePromoteViewer = useCallback(async (viewerId: string) => {
    if (!room || !isHost) return;
    // In real implementation, this would update room settings with moderator
    setRoomSettings(prev => ({
      ...prev,
      moderators: [...prev.moderators, viewerId],
    }));
  }, [room, isHost]);

  // Handle chat moderation
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!room || !isHost) return;
    // In real implementation, this would delete the message via API
  }, [room, isHost]);

  // Handle room deletion
  const handleDeleteRoom = useCallback(async () => {
    if (!room || !confirm("Are you sure you want to delete this room?")) return;
    await leaveRoom();
    router.push("/watch-party");
  }, [room, leaveRoom, router]);

  // Copy room URL to clipboard
  const handleCopyRoomUrl = useCallback(() => {
    if (!room) return;
    const url = `${window.location.origin}/watch-party/${room.id}`;
    navigator.clipboard.writeText(url);
    alert("Room URL copied to clipboard!");
  }, [room]);

  // Copy OBS URL to clipboard
  const handleCopyOBSUrl = useCallback(() => {
    if (!obsUrl) return;
    navigator.clipboard.writeText(obsUrl);
    alert("OBS URL copied to clipboard!");
  }, [obsUrl]);

  // Generate OBS URL
  const handleGenerateOBSUrl = useCallback(async () => {
    if (!room) return;
    await generateOBSUrl({
      width: 1920,
      height: 1080,
      showChat: true,
      showViewers: true,
      chromaKey: false,
      backgroundColor: "#000000",
    });
  }, [room, generateOBSUrl]);

  // Transform current video for presenter
  const currentVideo = room?.currentVideo ? {
    id: room.currentVideo.id,
    title: room.currentVideo.title,
    description: "",
    thumbnail: room.currentVideo.thumbnailUrl,
    url: "",
    platform: room.currentVideo.platform,
    duration: room.currentVideo.duration,
    creatorId: "",
    creatorName: room.currentVideo.channelName,
    createdAt: new Date(),
  } : null;

  // Auto-refresh analytics
  useEffect(() => {
    if (activeTab === "analytics" && room) {
      const interval = setInterval(() => {
        refreshAnalytics();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [activeTab, room, refreshAnalytics]);

  return (
    <HostDashboardPresenter
      activeTab={activeTab}
      onTabChange={setActiveTab}
      room={room}
      isCreating={isCreating}
      isConnected={isConnected}
      roomSettings={roomSettings}
      onUpdateSettings={handleUpdateSettings}
      onCreateRoom={handleCreateRoom}
      onDeleteRoom={handleDeleteRoom}
      onCopyRoomUrl={handleCopyRoomUrl}
      playlists={playlists}
      isLoadingPlaylists={isLoadingPlaylists}
      selectedPlaylist={selectedPlaylist}
      onSelectPlaylist={handleSelectPlaylist}
      selectedVideos={selectedVideos}
      onToggleVideo={handleToggleVideo}
      onReorderVideos={handleReorderVideos}
      viewers={viewers}
      onKickViewer={handleKickViewer}
      onBanViewer={handleBanViewer}
      onPromoteViewer={handlePromoteViewer}
      chatMessages={chatMessages}
      onDeleteMessage={handleDeleteMessage}
      onPlaybackControl={handlePlaybackControl}
      analytics={analytics}
      isLoadingAnalytics={isLoadingAnalytics}
      obsUrl={obsUrl}
      obsSettings={obsSettings}
      onGenerateOBSUrl={handleGenerateOBSUrl}
      onUpdateOBSSettings={updateOBSSettings}
      onCopyOBSUrl={handleCopyOBSUrl}
    />
  );
}

// Wrapper component that provides the sync context
export const HostDashboardSyncContainer = () => {
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
      <HostDashboardSyncInner />
    </WatchPartySyncProvider>
  );
};
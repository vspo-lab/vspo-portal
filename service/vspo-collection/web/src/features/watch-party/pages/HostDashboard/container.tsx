"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useOBSIntegration } from "../../hooks/useOBSIntegration";
import { usePlaylistManager } from "../../hooks/usePlaylistManager";
import { useRoomAnalytics } from "../../hooks/useRoomAnalytics";
import { useWatchPartyHost } from "../../hooks/useWatchPartyHost";
import type {
  Analytics,
  ChatMessage,
  Playlist,
  RoomSettings,
  Video,
  Viewer,
  WatchPartyRoom,
} from "../../types";
import { HostDashboardPresenter } from "./presenter";

export const HostDashboardContainer = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"setup" | "control" | "analytics">(
    "setup",
  );
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null,
  );
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
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
    room,
    isCreating,
    isConnected,
    viewers,
    chatMessages,
    createRoom,
    updateRoom,
    deleteRoom,
    kickViewer,
    banViewer,
    unbanViewer,
    promoteToModerator,
    demoteFromModerator,
    sendChatMessage,
    deleteChatMessage,
    syncPlayback,
    controlPlayback,
  } = useWatchPartyHost();

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

  const { analytics, isLoadingAnalytics, refreshAnalytics } = useRoomAnalytics(
    room?.id,
  );

  const {
    obsUrl,
    obsSettings,
    generateOBSUrl,
    updateOBSSettings,
    testOBSConnection,
  } = useOBSIntegration(room?.id);

  // Handle room creation
  const handleCreateRoom = useCallback(async () => {
    if (!roomSettings.name) return;

    const roomData = {
      ...roomSettings,
      playlist: selectedPlaylist,
      videos: selectedVideos,
    };

    const newRoom = await createRoom(roomData);
    if (newRoom) {
      setActiveTab("control");
    }
  }, [roomSettings, selectedPlaylist, selectedVideos, createRoom]);

  // Handle room settings update
  const handleUpdateSettings = useCallback(
    async (newSettings: Partial<RoomSettings>) => {
      setRoomSettings((prev) => ({ ...prev, ...newSettings }));
      if (room) {
        await updateRoom(room.id, newSettings);
      }
    },
    [room, updateRoom],
  );

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
  const handleReorderVideos = useCallback(
    (videos: Video[]) => {
      setSelectedVideos(videos);
      if (room && selectedPlaylist) {
        reorderPlaylistVideos(
          selectedPlaylist.id,
          videos.map((v) => v.id),
        );
      }
    },
    [room, selectedPlaylist, reorderPlaylistVideos],
  );

  // Handle playback control
  const handlePlaybackControl = useCallback(
    async (
      action: "play" | "pause" | "skip" | "previous",
      timestamp?: number,
    ) => {
      if (!room) return;
      await controlPlayback(room.id, action, timestamp);
    },
    [room, controlPlayback],
  );

  // Handle viewer management
  const handleKickViewer = useCallback(
    async (viewerId: string) => {
      if (!room) return;
      await kickViewer(room.id, viewerId);
    },
    [room, kickViewer],
  );

  const handleBanViewer = useCallback(
    async (viewerId: string) => {
      if (!room) return;
      await banViewer(room.id, viewerId);
    },
    [room, banViewer],
  );

  const handlePromoteViewer = useCallback(
    async (viewerId: string) => {
      if (!room) return;
      await promoteToModerator(room.id, viewerId);
    },
    [room, promoteToModerator],
  );

  // Handle chat moderation
  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      if (!room) return;
      await deleteChatMessage(room.id, messageId);
    },
    [room, deleteChatMessage],
  );

  // Handle room deletion
  const handleDeleteRoom = useCallback(async () => {
    if (!room || !confirm("Are you sure you want to delete this room?")) return;
    await deleteRoom(room.id);
    router.push("/watch-party");
  }, [room, deleteRoom, router]);

  // Copy room URL to clipboard
  const handleCopyRoomUrl = useCallback(() => {
    if (!room) return;
    const url = `${window.location.origin}/watch-party/room/${room.id}`;
    navigator.clipboard.writeText(url);
  }, [room]);

  // Copy OBS URL to clipboard
  const handleCopyOBSUrl = useCallback(() => {
    if (!obsUrl) return;
    navigator.clipboard.writeText(obsUrl);
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

  // Auto-refresh analytics
  useEffect(() => {
    if (activeTab === "analytics" && room) {
      const interval = setInterval(() => {
        refreshAnalytics();
      }, 30000); // Refresh every 30 seconds

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
};

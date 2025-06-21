"use client";

import { useCallback, useEffect, useState } from "react";
import { WatchPartySyncProvider, useWatchPartySync } from "../../contexts/WatchPartySyncContext";
import type { WatchPartyReaction } from "../../types";
import { type OBSOverlayConfig, OBSOverlayPresenter } from "./presenter";

interface OBSOverlaySyncContainerProps {
  roomId: string;
  config: {
    position?: string;
    theme?: string;
    showChat?: string;
    showReactions?: string;
    showViewers?: string;
    showVideo?: string;
    opacity?: string;
    scale?: string;
  };
}

// Inner container that uses the sync context
function OBSOverlaySyncInner({ roomId, config }: OBSOverlaySyncContainerProps) {
  const {
    room,
    isConnected,
    reactions,
    chatMessages,
    joinRoom,
    playbackState,
  } = useWatchPartySync();

  const [displayReactions, setDisplayReactions] = useState<WatchPartyReaction[]>([]);

  // Parse configuration from URL params
  const overlayConfig: OBSOverlayConfig = {
    position: (config.position as OBSOverlayConfig["position"]) || "bottom-right",
    theme: (config.theme as OBSOverlayConfig["theme"]) || "dark",
    showChat: config.showChat !== "false",
    showReactions: config.showReactions !== "false",
    showViewers: config.showViewers !== "false",
    showVideo: config.showVideo !== "false",
    opacity: config.opacity ? Number.parseFloat(config.opacity) : 1,
    scale: config.scale ? Number.parseFloat(config.scale) : 1,
  };

  // Join room on mount
  useEffect(() => {
    if (!room) {
      // Join as observer (no user interaction)
      joinRoom(roomId, `obs-overlay-${Date.now()}`, {
        id: roomId,
        name: "OBS Overlay",
        description: "",
        hostId: "system",
        settings: {
          name: "OBS Overlay",
          description: "",
          maxViewers: 1000,
          isPrivate: false,
          allowChat: false,
          autoSync: true,
          syncInterval: 1000, // Faster sync for overlay
          moderators: [],
          bannedUsers: [],
        },
        currentVideo: null,
        currentTimestamp: 0,
        playbackState: "paused",
        viewers: [],
        isPlaying: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, [roomId, room, joinRoom]);

  // Update display reactions
  useEffect(() => {
    setDisplayReactions(reactions);
  }, [reactions]);

  // Update room with playback state
  const roomWithPlayback = room ? {
    ...room,
    isPlaying: playbackState?.isPlaying || false,
    currentTimestamp: playbackState?.currentTime || 0,
    currentVideo: room.currentVideo ? {
      ...room.currentVideo,
      currentTime: playbackState?.currentTime || 0,
    } : null,
  } : null;

  const handleReactionComplete = useCallback((reactionId: string) => {
    setDisplayReactions((prev) => prev.filter((r) => r.id !== reactionId));
  }, []);

  return (
    <OBSOverlayPresenter
      room={roomWithPlayback}
      reactions={displayReactions}
      config={overlayConfig}
      isConnected={isConnected}
      onReactionComplete={handleReactionComplete}
    />
  );
}

// Wrapper component that provides the sync context
export function OBSOverlaySyncContainer(props: OBSOverlaySyncContainerProps) {
  return (
    <WatchPartySyncProvider
      userId={`obs-overlay-${Date.now()}`}
      userName="OBS Overlay"
      userAvatar=""
    >
      <OBSOverlaySyncInner {...props} />
    </WatchPartySyncProvider>
  );
}
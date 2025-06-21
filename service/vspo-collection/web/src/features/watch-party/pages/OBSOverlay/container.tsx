"use client";

import { useCallback, useEffect, useState } from "react";
import type { WatchPartyReaction, WatchPartyRoom } from "../../types";
import { type OBSOverlayConfig, OBSOverlayPresenter } from "./presenter";

interface OBSOverlayContainerProps {
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

export function OBSOverlayContainer({
  roomId,
  config,
}: OBSOverlayContainerProps) {
  const [room, setRoom] = useState<WatchPartyRoom | null>(null);
  const [reactions, setReactions] = useState<WatchPartyReaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Parse configuration from URL params
  const overlayConfig: OBSOverlayConfig = {
    position:
      (config.position as OBSOverlayConfig["position"]) || "bottom-right",
    theme: (config.theme as OBSOverlayConfig["theme"]) || "dark",
    showChat: config.showChat !== "false",
    showReactions: config.showReactions !== "false",
    showViewers: config.showViewers !== "false",
    showVideo: config.showVideo !== "false",
    opacity: config.opacity ? Number.parseFloat(config.opacity) : 1,
    scale: config.scale ? Number.parseFloat(config.scale) : 1,
  };

  // Mock data for development
  useEffect(() => {
    // In production, this would connect to WebSocket/real-time service
    setRoom({
      id: roomId,
      name: "VSPO Watch Party",
      hostId: "host123",
      currentVideo: {
        id: "video123",
        title: "VSPO! 最強決定戦 DAY1 【Apex Legends】",
        channelName: "ぶいすぽっ！公式",
        thumbnailUrl:
          "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        platform: "youtube",
        duration: 3600,
        currentTime: 1234,
      },
      viewers: [
        { id: "1", name: "User1", avatarUrl: null },
        { id: "2", name: "User2", avatarUrl: null },
        { id: "3", name: "User3", avatarUrl: null },
      ],
      isPlaying: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setIsConnected(true);

    // Simulate reactions
    const reactionInterval = setInterval(() => {
      const newReaction: WatchPartyReaction = {
        id: Math.random().toString(),
        userId: Math.random().toString(),
        userName: `User${Math.floor(Math.random() * 10)}`,
        type: ["heart", "laugh", "wow", "fire", "clap"][
          Math.floor(Math.random() * 5)
        ] as WatchPartyReaction["type"],
        timestamp: new Date().toISOString(),
      };
      setReactions((prev) => [...prev.slice(-10), newReaction]);
    }, 5000);

    return () => {
      clearInterval(reactionInterval);
    };
  }, [roomId]);

  const handleReactionComplete = useCallback((reactionId: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== reactionId));
  }, []);

  return (
    <OBSOverlayPresenter
      room={room}
      reactions={reactions}
      config={overlayConfig}
      isConnected={isConnected}
      onReactionComplete={handleReactionComplete}
    />
  );
}

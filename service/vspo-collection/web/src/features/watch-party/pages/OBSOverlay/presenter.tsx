"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { WatchPartyReaction, WatchPartyRoom } from "../../types";
import styles from "./styles.module.css";

export interface OBSOverlayConfig {
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";
  theme: "dark" | "light" | "transparent";
  showChat: boolean;
  showReactions: boolean;
  showViewers: boolean;
  showVideo: boolean;
  opacity: number;
  scale: number;
}

interface OBSOverlayPresenterProps {
  room: WatchPartyRoom | null;
  reactions: WatchPartyReaction[];
  config: OBSOverlayConfig;
  isConnected: boolean;
  onReactionComplete: (reactionId: string) => void;
}

const reactionEmojis = {
  heart: "❤️",
  laugh: "😂",
  wow: "😮",
  fire: "🔥",
  clap: "👏",
};

export function OBSOverlayPresenter({
  room,
  reactions,
  config,
  isConnected,
  onReactionComplete,
}: OBSOverlayPresenterProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!room?.currentVideo || !room.isPlaying) return;

    const interval = setInterval(() => {
      setProgress(
        (room.currentVideo.currentTime / room.currentVideo.duration) * 100,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [room]);

  const getPositionClasses = () => {
    const positions = {
      "top-left": styles.topLeft,
      "top-right": styles.topRight,
      "bottom-left": styles.bottomLeft,
      "bottom-right": styles.bottomRight,
      "top-center": styles.topCenter,
      "bottom-center": styles.bottomCenter,
    };
    return positions[config.position];
  };

  const getThemeClasses = () => {
    const themes = {
      dark: styles.themeDark,
      light: styles.themeLight,
      transparent: styles.themeTransparent,
    };
    return themes[config.theme];
  };

  if (!room || !isConnected) return null;

  return (
    <div
      className={`${styles.obsOverlay} ${getPositionClasses()} ${getThemeClasses()}`}
      style={{
        opacity: config.opacity,
        transform: `scale(${config.scale})`,
      }}
    >
      {/* Video Info */}
      {config.showVideo && room.currentVideo && (
        <motion.div
          className={styles.videoInfo}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.videoThumbnail}>
            <img src={room.currentVideo.thumbnailUrl} alt="" />
            <div className={styles.playStatus}>
              {room.isPlaying ? (
                <span className={styles.liveIndicator}>● LIVE</span>
              ) : (
                <span className={styles.pausedIndicator}>⏸ PAUSED</span>
              )}
            </div>
          </div>
          <div className={styles.videoDetails}>
            <h3>{room.currentVideo.title}</h3>
            <p>{room.currentVideo.channelName}</p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Viewer Count */}
      {config.showViewers && (
        <motion.div
          className={styles.viewerCount}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <span className={styles.viewerIcon}>👥</span>
          <span className={styles.viewerNumber}>{room.viewers.length}</span>
          <span className={styles.viewerLabel}>watching</span>
        </motion.div>
      )}

      {/* Reactions */}
      {config.showReactions && (
        <div className={styles.reactionsContainer}>
          <AnimatePresence>
            {reactions.map((reaction) => (
              <motion.div
                key={reaction.id}
                className={styles.reaction}
                initial={{ opacity: 0, scale: 0, y: 50 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: { type: "spring", stiffness: 500, damping: 25 },
                }}
                exit={{
                  opacity: 0,
                  y: -100,
                  transition: { duration: 1 },
                }}
                onAnimationComplete={() => {
                  setTimeout(() => onReactionComplete(reaction.id), 3000);
                }}
              >
                <span className={styles.reactionEmoji}>
                  {reactionEmojis[reaction.type]}
                </span>
                <span className={styles.reactionUser}>{reaction.userName}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Chat Overlay (Placeholder) */}
      {config.showChat && (
        <motion.div
          className={styles.chatOverlay}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.chatHeader}>
            <span>💬 Chat</span>
          </div>
          <div className={styles.chatMessages}>
            <p className={styles.chatPlaceholder}>
              Chat messages would appear here in real-time
            </p>
          </div>
        </motion.div>
      )}

      {/* Connection Status */}
      <div className={styles.connectionStatus}>
        <span className={isConnected ? styles.connected : styles.disconnected}>
          {isConnected ? "●" : "○"}
        </span>
      </div>
    </div>
  );
}

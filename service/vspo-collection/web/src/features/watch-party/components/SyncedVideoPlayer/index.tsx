import type { FC } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { VideoControls } from "./VideoControls";
import { VideoEmbed } from "./VideoEmbed";
import { VideoOverlay } from "./VideoOverlay";
import type { SyncedVideoPlayerProps, VideoState } from "./types";

export const SyncedVideoPlayer: FC<SyncedVideoPlayerProps> = ({
  video,
  room,
  isHost,
  onPlaybackControl,
  onSyncUpdate,
  onQualityChange,
  className = "",
}) => {
  const playerRef = useRef<any>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef<number>(0);

  const [videoState, setVideoState] = useState<VideoState>({
    isPlaying: room?.playbackState === "playing" || false,
    currentTime: room?.currentTimestamp || 0,
    duration: video?.duration || 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    isPictureInPicture: false,
    isBuffering: false,
    quality: "auto",
    playbackRate: 1,
  });

  const [syncStatus, setSyncStatus] = useState<{
    isSynced: true;
    lastSyncTime: number;
    syncOffset: number;
  }>({
    isSynced: true,
    lastSyncTime: Date.now(),
    syncOffset: 0,
  });

  // Handle sync updates from the server
  useEffect(() => {
    if (!room || isHost) return;

    const targetTime = room.currentTimestamp;
    const currentTime = videoState.currentTime;
    const timeDiff = Math.abs(targetTime - currentTime);

    // If time difference is more than 2 seconds, sync
    if (timeDiff > 2) {
      handleSeek(targetTime);
      setSyncStatus({
        isSynced: false,
        lastSyncTime: Date.now(),
        syncOffset: timeDiff,
      });

      // Mark as synced after a delay
      setTimeout(() => {
        setSyncStatus((prev) => ({ ...prev, isSynced: true }));
      }, 1000);
    }
  }, [room?.currentTimestamp, room?.playbackState]);

  // Auto-sync for host
  useEffect(() => {
    if (!isHost || !room?.settings.autoSync) return;

    const syncInterval = room.settings.syncInterval || 5000;

    syncIntervalRef.current = setInterval(() => {
      if (videoState.isPlaying && !videoState.isBuffering) {
        const now = Date.now();
        if (now - lastSyncTimeRef.current > syncInterval) {
          onSyncUpdate?.(videoState.currentTime);
          lastSyncTimeRef.current = now;
        }
      }
    }, 1000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isHost, room?.settings, videoState.isPlaying, videoState.currentTime]);

  const handlePlayPause = useCallback(() => {
    const newState = !videoState.isPlaying;
    setVideoState((prev) => ({ ...prev, isPlaying: newState }));

    if (isHost) {
      onPlaybackControl?.(newState ? "play" : "pause", videoState.currentTime);
    }
  }, [videoState.isPlaying, videoState.currentTime, isHost, onPlaybackControl]);

  const handleSeek = useCallback(
    (time: number) => {
      setVideoState((prev) => ({ ...prev, currentTime: time }));
      if (playerRef.current) {
        playerRef.current.seekTo(time);
      }

      if (isHost) {
        onSyncUpdate?.(time);
      }
    },
    [isHost, onSyncUpdate],
  );

  const handleVolumeChange = useCallback((volume: number) => {
    setVideoState((prev) => ({ ...prev, volume, isMuted: volume === 0 }));
  }, []);

  const handleMuteToggle = useCallback(() => {
    setVideoState((prev) => ({
      ...prev,
      isMuted: !prev.isMuted,
      volume: prev.isMuted ? prev.volume || 1 : 0,
    }));
  }, []);

  const handleFullscreenToggle = useCallback(() => {
    const container = document.querySelector(".video-player-container");
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setVideoState((prev) => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setVideoState((prev) => ({ ...prev, isFullscreen: false }));
    }
  }, []);

  const handlePictureInPicture = useCallback(async () => {
    try {
      if (!document.pictureInPictureElement) {
        const video = document.querySelector("video");
        if (video) {
          await video.requestPictureInPicture();
          setVideoState((prev) => ({ ...prev, isPictureInPicture: true }));
        }
      } else {
        await document.exitPictureInPicture();
        setVideoState((prev) => ({ ...prev, isPictureInPicture: false }));
      }
    } catch (error) {
      console.error("PiP error:", error);
    }
  }, []);

  const handleQualityChange = useCallback(
    (quality: string) => {
      setVideoState((prev) => ({ ...prev, quality }));
      onQualityChange?.(quality);
    },
    [onQualityChange],
  );

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setVideoState((prev) => ({ ...prev, playbackRate: rate }));
  }, []);

  // Update video state from player events
  const handlePlayerStateChange = useCallback(
    (state: Partial<VideoState>) => {
      setVideoState((prev) => ({ ...prev, ...state }));

      // Send sync update if host and playing
      if (isHost && state.isPlaying && state.currentTime !== undefined) {
        const now = Date.now();
        if (now - lastSyncTimeRef.current > 1000) {
          onSyncUpdate?.(state.currentTime);
          lastSyncTimeRef.current = now;
        }
      }
    },
    [isHost, onSyncUpdate],
  );

  if (!video) {
    return (
      <div className={`bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <p className="text-white/60">No video selected</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`video-player-container relative bg-black rounded-lg overflow-hidden group ${className}`}
    >
      {/* Video Embed */}
      <VideoEmbed
        ref={playerRef}
        video={video}
        videoState={videoState}
        onStateChange={handlePlayerStateChange}
        isHost={isHost}
      />

      {/* Overlay (sync status, buffering, etc.) */}
      <VideoOverlay
        isBuffering={videoState.isBuffering}
        syncStatus={syncStatus}
        isHost={isHost}
      />

      {/* Video Controls */}
      <VideoControls
        videoState={videoState}
        video={video}
        isHost={isHost}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onMuteToggle={handleMuteToggle}
        onFullscreenToggle={handleFullscreenToggle}
        onPictureInPicture={handlePictureInPicture}
        onQualityChange={handleQualityChange}
        onPlaybackRateChange={handlePlaybackRateChange}
      />
    </div>
  );
};

export * from "./types";
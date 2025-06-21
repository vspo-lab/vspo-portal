import type { Video, WatchPartyRoom } from "../../types";

export interface SyncedVideoPlayerProps {
  video: Video | null;
  room: WatchPartyRoom | null;
  isHost: boolean;
  onPlaybackControl?: (action: "play" | "pause", timestamp: number) => void;
  onSyncUpdate?: (timestamp: number) => void;
  onQualityChange?: (quality: string) => void;
  className?: string;
}

export interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isPictureInPicture: boolean;
  isBuffering: boolean;
  quality: string;
  playbackRate: number;
}

export interface VideoControlsProps {
  videoState: VideoState;
  video: Video;
  isHost: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onPictureInPicture: () => void;
  onQualityChange: (quality: string) => void;
  onPlaybackRateChange: (rate: number) => void;
}

export interface VideoEmbedProps {
  video: Video;
  videoState: VideoState;
  onStateChange: (state: Partial<VideoState>) => void;
  isHost: boolean;
}

export interface VideoOverlayProps {
  isBuffering: boolean;
  syncStatus: {
    isSynced: boolean;
    lastSyncTime: number;
    syncOffset: number;
  };
  isHost: boolean;
}
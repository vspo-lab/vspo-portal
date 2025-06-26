import { Livestream } from "@/features/shared/domain";
import { useCallback, useEffect, useState } from "react";

export interface StreamPlaybackState {
  streamId: string;
  volume: number;
  isMuted: boolean;
  isPlaying: boolean;
}

export interface UsePlaybackControlsProps {
  streams: Livestream[];
}

export interface UsePlaybackControlsReturn {
  streamStates: Record<string, StreamPlaybackState>;
  globalVolume: number;
  isGlobalMuted: boolean;
  onToggleGlobalPlay: () => void;
  onSetGlobalVolume: (volume: number) => void;
  onToggleGlobalMute: () => void;
  onToggleStreamPlay: (streamId: string) => void;
  onSetStreamVolume: (streamId: string, volume: number) => void;
  onToggleStreamMute: (streamId: string) => void;
}

export const usePlaybackControls = ({
  streams,
}: UsePlaybackControlsProps): UsePlaybackControlsReturn => {
  const [globalVolume, setGlobalVolume] = useState(70);
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);
  const [streamStates, setStreamStates] = useState<
    Record<string, StreamPlaybackState>
  >({});

  // Initialize stream states when streams change
  useEffect(() => {
    setStreamStates((prev) => {
      const newStates = { ...prev };

      // Add new streams
      streams.forEach((stream, index) => {
        if (!newStates[stream.id]) {
          newStates[stream.id] = {
            streamId: stream.id,
            volume: globalVolume,
            isMuted: index !== 0, // Only first stream unmuted
            isPlaying: false,
          };
        }
      });

      // Remove old streams
      const currentIds = new Set(streams.map((s) => s.id));
      Object.keys(newStates).forEach((id) => {
        if (!currentIds.has(id)) {
          delete newStates[id];
        }
      });

      return newStates;
    });
  }, [streams, globalVolume]);

  const onToggleGlobalPlay = useCallback(() => {
    const anyPlaying = Object.values(streamStates).some((s) => s.isPlaying);
    const newPlaying = !anyPlaying;

    setStreamStates((prev) => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach((id) => {
        newStates[id] = { ...newStates[id], isPlaying: newPlaying };
      });
      return newStates;
    });
  }, [streamStates]);

  const onSetGlobalVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    setGlobalVolume(clampedVolume);

    setStreamStates((prev) => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach((id) => {
        if (!newStates[id].isMuted) {
          newStates[id] = { ...newStates[id], volume: clampedVolume };
        }
      });
      return newStates;
    });
  }, []);

  const onToggleGlobalMute = useCallback(() => {
    const newMuted = !isGlobalMuted;
    setIsGlobalMuted(newMuted);

    setStreamStates((prev) => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach((id) => {
        newStates[id] = { ...newStates[id], isMuted: newMuted };
      });
      return newStates;
    });
  }, [isGlobalMuted]);

  const onToggleStreamPlay = useCallback((streamId: string) => {
    setStreamStates((prev) => ({
      ...prev,
      [streamId]: {
        ...prev[streamId],
        isPlaying: !prev[streamId]?.isPlaying,
      },
    }));
  }, []);

  const onSetStreamVolume = useCallback((streamId: string, volume: number) => {
    const clampedVolume = Math.max(0, Math.min(100, volume));
    setStreamStates((prev) => ({
      ...prev,
      [streamId]: {
        ...prev[streamId],
        volume: clampedVolume,
      },
    }));
  }, []);

  const onToggleStreamMute = useCallback((streamId: string) => {
    setStreamStates((prev) => ({
      ...prev,
      [streamId]: {
        ...prev[streamId],
        isMuted: !prev[streamId]?.isMuted,
      },
    }));
  }, []);

  return {
    streamStates,
    globalVolume,
    isGlobalMuted,
    onToggleGlobalPlay,
    onSetGlobalVolume,
    onToggleGlobalMute,
    onToggleStreamPlay,
    onSetStreamVolume,
    onToggleStreamMute,
  };
};

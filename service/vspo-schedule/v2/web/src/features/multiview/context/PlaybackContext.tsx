import React, { createContext, useContext, useCallback, useRef } from "react";

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  getState: () => {
    isMuted: boolean;
    volume: number;
  };
  toggleFullscreen: () => void;
}

interface PlaybackContextType {
  registerPlayer: (streamId: string, player: VideoPlayerRef) => void;
  unregisterPlayer: (streamId: string) => void;
  getPlayer: (streamId: string) => VideoPlayerRef | undefined;
  getAllPlayers: () => Map<string, VideoPlayerRef>;
  // Batch controls
  playAll: () => void;
  pauseAll: () => void;
  muteAll: () => void;
  unmuteAll: () => void;
  setAllVolume: (volume: number) => void;
}

const PlaybackContext = createContext<PlaybackContextType | null>(null);

export const usePlaybackContext = () => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error("usePlaybackContext must be used within PlaybackProvider");
  }
  return context;
};

export const PlaybackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const playersRef = useRef<Map<string, VideoPlayerRef>>(new Map());

  const registerPlayer = useCallback(
    (streamId: string, player: VideoPlayerRef) => {
      playersRef.current.set(streamId, player);
    },
    [],
  );

  const unregisterPlayer = useCallback((streamId: string) => {
    playersRef.current.delete(streamId);
  }, []);

  const getPlayer = useCallback((streamId: string) => {
    return playersRef.current.get(streamId);
  }, []);

  const getAllPlayers = useCallback(() => {
    return new Map(playersRef.current);
  }, []);

  const playAll = useCallback(() => {
    playersRef.current.forEach((player) => {
      player.play();
    });
  }, []);

  const pauseAll = useCallback(() => {
    playersRef.current.forEach((player) => {
      player.pause();
    });
  }, []);

  const muteAll = useCallback(() => {
    playersRef.current.forEach((player) => {
      player.mute();
    });
  }, []);

  const unmuteAll = useCallback(() => {
    playersRef.current.forEach((player) => {
      player.unmute();
    });
  }, []);

  const setAllVolume = useCallback((volume: number) => {
    playersRef.current.forEach((player) => {
      player.setVolume(volume);
    });
  }, []);

  const contextValue: PlaybackContextType = {
    registerPlayer,
    unregisterPlayer,
    getPlayer,
    getAllPlayers,
    playAll,
    pauseAll,
    muteAll,
    unmuteAll,
    setAllVolume,
  };

  return (
    <PlaybackContext.Provider value={contextValue}>
      {children}
    </PlaybackContext.Provider>
  );
};

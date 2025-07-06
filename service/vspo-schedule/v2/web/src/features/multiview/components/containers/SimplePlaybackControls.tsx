import { Livestream } from "@/features/shared/domain";
import React, { useCallback } from "react";
import { usePlaybackContext } from "../../context/PlaybackContext";
import { usePlaybackControls } from "../../hooks/usePlaybackControls";
import { SimplePlaybackControlsPresenter } from "../presenters";

export interface SimplePlaybackControlsProps {
  streams: Livestream[];
  isVisible?: boolean;
}

export const SimplePlaybackControls: React.FC<SimplePlaybackControlsProps> = ({
  streams,
  isVisible = true,
}) => {
  const playbackContext = usePlaybackContext();
  const controls = usePlaybackControls({ streams });

  // Global controls
  const handleToggleGlobalPlay = useCallback(() => {
    const anyPlaying = Object.values(controls.streamStates).some(
      (s) => s.isPlaying,
    );

    controls.onToggleGlobalPlay();
    if (anyPlaying) {
      playbackContext.pauseAll();
    } else {
      playbackContext.playAll();
    }
  }, [controls, playbackContext]);

  const handleSetGlobalVolume = useCallback(
    (volume: number) => {
      controls.onSetGlobalVolume(volume);
      playbackContext.setAllVolume(volume / 100);
    },
    [controls, playbackContext],
  );

  const handleToggleGlobalMute = useCallback(() => {
    controls.onToggleGlobalMute();
    if (controls.isGlobalMuted) {
      playbackContext.unmuteAll();
    } else {
      playbackContext.muteAll();
    }
  }, [controls, playbackContext]);

  // Stream controls
  const handleSetStreamVolume = useCallback(
    (streamId: string, volume: number) => {
      controls.onSetStreamVolume(streamId, volume);
      const player = playbackContext.getPlayer(streamId);
      if (player) {
        player.setVolume(volume / 100);
      }
    },
    [controls, playbackContext],
  );

  const handleToggleStreamMute = useCallback(
    (streamId: string) => {
      controls.onToggleStreamMute(streamId);
      const player = playbackContext.getPlayer(streamId);
      const currentState = controls.streamStates[streamId];
      if (player && currentState) {
        if (currentState.isMuted) {
          player.unmute();
        } else {
          player.mute();
        }
      }
    },
    [controls, playbackContext],
  );

  const handleToggleStreamPlay = useCallback(
    (streamId: string) => {
      controls.onToggleStreamPlay(streamId);
      const player = playbackContext.getPlayer(streamId);
      const currentState = controls.streamStates[streamId];
      if (player && currentState) {
        if (currentState.isPlaying) {
          player.pause();
        } else {
          player.play();
        }
      }
    },
    [controls, playbackContext],
  );

  if (!isVisible || streams.length === 0) {
    return null;
  }

  return (
    <SimplePlaybackControlsPresenter
      streams={streams}
      streamStates={controls.streamStates}
      globalVolume={controls.globalVolume}
      isGlobalMuted={controls.isGlobalMuted}
      onToggleGlobalPlay={handleToggleGlobalPlay}
      onSetGlobalVolume={handleSetGlobalVolume}
      onToggleGlobalMute={handleToggleGlobalMute}
      onToggleStreamPlay={handleToggleStreamPlay}
      onSetStreamVolume={handleSetStreamVolume}
      onToggleStreamMute={handleToggleStreamMute}
    />
  );
};

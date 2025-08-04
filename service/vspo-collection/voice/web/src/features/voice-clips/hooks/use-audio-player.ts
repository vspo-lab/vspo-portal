"use client";

import { useCallback, useEffect, useRef } from "react";

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentClipIdRef = useRef<number | null>(null);

  const play = useCallback((audioUrl: string, clipId: number) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Create new audio instance
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    currentClipIdRef.current = clipId;

    // Play the audio
    audio.play().catch(console.error);

    // Handle when audio ends
    audio.addEventListener("ended", () => {
      audioRef.current = null;
      currentClipIdRef.current = null;
    });

    return audio;
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      currentClipIdRef.current = null;
    }
  }, []);

  const toggle = useCallback(
    (audioUrl: string, clipId: number) => {
      if (
        currentClipIdRef.current === clipId &&
        audioRef.current &&
        !audioRef.current.paused
      ) {
        stop();
        return false;
      }
      play(audioUrl, clipId);
      return true;
    },
    [play, stop],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return {
    play,
    stop,
    toggle,
    isPlaying: (clipId: number) =>
      currentClipIdRef.current === clipId &&
      audioRef.current &&
      !audioRef.current.paused,
  };
}

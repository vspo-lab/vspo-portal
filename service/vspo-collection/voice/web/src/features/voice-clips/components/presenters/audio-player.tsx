"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  audioUrl: string;
  isPlaying: boolean;
  onPlayStateChange: (isPlaying: boolean) => void;
  showVolumeControl?: boolean;
  className?: string;
}

export function AudioPlayer({
  audioUrl,
  isPlaying,
  onPlayStateChange,
  showVolumeControl = true,
  className = "",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      onPlayStateChange(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onPlayStateChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const formatTime = (time: number) => {
    if (Number.isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number.parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-gray-100 dark:bg-zinc-700 rounded-lg p-4 ${className}`}>
      <audio ref={audioRef} src={audioUrl} />

      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => onPlayStateChange(!isPlaying)}
          className={`p-2 rounded-full transition-colors ${
            isPlaying
              ? "bg-amber-600 text-white dark:text-zinc-900 hover:bg-amber-700 dark:hover:bg-amber-500"
              : "bg-gray-300 dark:bg-zinc-600 text-gray-700 dark:text-amber-100 hover:bg-gray-400 dark:hover:bg-zinc-500"
          }`}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1">
          <div
            className="relative h-2 bg-gray-300 dark:bg-zinc-600 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="absolute left-0 top-0 h-full bg-amber-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full shadow-md"
              style={{
                left: `${progress}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-zinc-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {showVolumeControl && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors text-gray-700 dark:text-amber-100"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-amber-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}

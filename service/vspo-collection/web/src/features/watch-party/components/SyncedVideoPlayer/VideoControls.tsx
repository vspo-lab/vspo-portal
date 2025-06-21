import {
  Maximize,
  Pause,
  PictureInPicture,
  Play,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { FC } from "react";
import { useCallback, useRef, useState } from "react";
import type { VideoControlsProps } from "./types";

export const VideoControls: FC<VideoControlsProps> = ({
  videoState,
  video,
  isHost,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  onPictureInPicture,
  onQualityChange,
  onPlaybackRateChange,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isHost || !progressRef.current) return;

      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * videoState.duration;

      onSeek(Math.max(0, Math.min(newTime, videoState.duration)));
    },
    [isHost, videoState.duration, onSeek],
  );

  const handleVolumeHover = useCallback(() => {
    setShowVolumeSlider(true);
    if (volumeTimerRef.current) {
      clearTimeout(volumeTimerRef.current);
    }
  }, []);

  const handleVolumeLeave = useCallback(() => {
    volumeTimerRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 1000);
  }, []);

  const progress = videoState.duration
    ? (videoState.currentTime / videoState.duration) * 100
    : 0;

  const qualityOptions = ["auto", "1080p", "720p", "480p", "360p"];
  const playbackRateOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      {/* Progress Bar */}
      <div
        ref={progressRef}
        className={`relative h-1 bg-white/20 rounded-full mb-4 ${
          isHost ? "cursor-pointer" : ""
        }`}
        onClick={handleProgressClick}
      >
        <div
          className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
        {isHost && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-lg transition-all duration-100"
            style={{ left: `${progress}%`, marginLeft: "-6px" }}
          />
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            disabled={!isHost}
            className={`text-white hover:text-white/80 transition-colors ${
              !isHost ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={videoState.isPlaying ? "Pause" : "Play"}
          >
            {videoState.isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>

          {/* Volume Control */}
          <div
            className="relative flex items-center"
            onMouseEnter={handleVolumeHover}
            onMouseLeave={handleVolumeLeave}
          >
            <button
              onClick={onMuteToggle}
              className="text-white hover:text-white/80 transition-colors"
              title={videoState.isMuted ? "Unmute" : "Mute"}
            >
              {videoState.isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* Volume Slider */}
            <div
              className={`absolute left-8 flex items-center gap-2 bg-black/90 rounded px-2 py-1 transition-all duration-200 ${
                showVolumeSlider
                  ? "opacity-100 visible"
                  : "opacity-0 invisible"
              }`}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={videoState.isMuted ? 0 : videoState.volume}
                onChange={(e) => onVolumeChange(Number.parseFloat(e.target.value))}
                className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
            </div>
          </div>

          {/* Time Display */}
          <div className="text-white text-sm">
            {formatTime(videoState.currentTime)} /{" "}
            {formatTime(videoState.duration)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-white hover:text-white/80 transition-colors p-2"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {showSettings && (
              <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[200px]">
                {/* Quality Selector */}
                <div className="mb-2">
                  <p className="text-white/60 text-xs mb-1">Quality</p>
                  <div className="space-y-1">
                    {qualityOptions.map((quality) => (
                      <button
                        key={quality}
                        onClick={() => {
                          onQualityChange(quality);
                          setShowSettings(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                          videoState.quality === quality
                            ? "bg-white/20 text-white"
                            : "text-white/80 hover:bg-white/10"
                        }`}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Playback Speed */}
                <div className="border-t border-white/10 pt-2">
                  <p className="text-white/60 text-xs mb-1">Playback Speed</p>
                  <div className="space-y-1">
                    {playbackRateOptions.map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          onPlaybackRateChange(rate);
                          setShowSettings(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                          videoState.playbackRate === rate
                            ? "bg-white/20 text-white"
                            : "text-white/80 hover:bg-white/10"
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Picture-in-Picture */}
          <button
            onClick={onPictureInPicture}
            className="text-white hover:text-white/80 transition-colors p-2"
            title="Picture-in-Picture"
          >
            <PictureInPicture className="w-5 h-5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={onFullscreenToggle}
            className="text-white hover:text-white/80 transition-colors p-2"
            title="Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Host Indicator */}
      {isHost && (
        <div className="absolute top-4 left-4 bg-red-500 text-white text-xs px-2 py-1 rounded">
          HOST CONTROLS
        </div>
      )}
    </div>
  );
};
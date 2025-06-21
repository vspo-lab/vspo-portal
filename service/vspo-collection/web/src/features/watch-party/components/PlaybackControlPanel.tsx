import {
  Monitor,
  RefreshCw,
  SkipBack,
  SkipForward,
  Zap,
} from "lucide-react";
import type { FC } from "react";
import { useCallback } from "react";
import { Button } from "../../../shared/components/presenters/Button";
import { useSyncService } from "../hooks/useSyncService";
import type { Playlist, Video, WatchPartyRoom } from "../types";
import { SyncedVideoPlayer } from "./SyncedVideoPlayer";

interface PlaybackControlPanelProps {
  room: WatchPartyRoom;
  currentVideo: Video | null;
  playlist: Playlist | null;
  onPlaybackControl: (
    action: "play" | "pause" | "skip" | "previous",
    timestamp?: number,
  ) => void;
  isConnected: boolean;
}

export const PlaybackControlPanel: FC<PlaybackControlPanelProps> = ({
  room,
  currentVideo,
  playlist,
  onPlaybackControl,
  isConnected,
}) => {
  const currentIndex =
    playlist?.videos.findIndex((v) => v.id === currentVideo?.id) ?? -1;
  const hasNext = playlist && currentIndex < playlist.videos.length - 1;
  const hasPrevious = playlist && currentIndex > 0;

  // Use sync service for real-time sync
  const { sendSync, sendPlaybackControl, syncOffset } = useSyncService({
    roomId: room.id,
    isHost: true,
    onRoomUpdate: (updatedRoom) => {
      // Room updates are handled by the parent component
    },
  });

  const handleVideoPlaybackControl = useCallback(
    (action: "play" | "pause", timestamp: number) => {
      onPlaybackControl(action, timestamp);
      sendPlaybackControl(action, timestamp);
    },
    [onPlaybackControl, sendPlaybackControl],
  );

  const handleSyncUpdate = useCallback(
    (timestamp: number) => {
      sendSync(timestamp);
    },
    [sendSync],
  );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Playback Control</h3>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="text-sm text-gray-600">
            {room.playbackState === "playing" ? "Playing" : "Paused"}
          </span>
        </div>
      </div>

      {currentVideo ? (
        <div className="space-y-4">
          {/* Video Player */}
          <div className="bg-black rounded-lg overflow-hidden">
            <SyncedVideoPlayer
              video={currentVideo}
              room={room}
              isHost={true}
              onPlaybackControl={handleVideoPlaybackControl}
              onSyncUpdate={handleSyncUpdate}
              className="w-full"
            />
          </div>

          {/* Video Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {currentVideo.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {currentVideo.creatorName}
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPlaybackControl("previous")}
              disabled={!hasPrevious}
              className="flex items-center gap-2"
            >
              <SkipBack className="w-4 h-4" />
              Previous
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPlaybackControl("skip")}
              disabled={!hasNext}
              className="flex items-center gap-2"
            >
              Skip
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Sync Controls */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Auto-sync: {room.settings.autoSync ? "On" : "Off"}
              </span>
              {syncOffset > 0 && (
                <span className="text-xs text-gray-500">
                  (Offset: {syncOffset.toFixed(1)}s)
                </span>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => sendSync(room.currentTimestamp, true)}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Force Sync All
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No video selected</p>
          <p className="text-sm text-gray-400 mt-2">
            Select a playlist or video from the Setup tab
          </p>
        </div>
      )}

      {/* Playlist Queue */}
      {playlist && playlist.videos.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Up Next</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {playlist.videos
              .slice(currentIndex + 1, currentIndex + 4)
              .map((video, index) => (
                <div
                  key={video.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-500 w-6">
                    #{currentIndex + index + 2}
                  </span>
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-16 h-10 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {video.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {video.creatorName} • {formatDuration(video.duration)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
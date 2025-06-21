import type { FC } from "react";
import { useCallback, useState } from "react";
import { useSyncService } from "../hooks/useSyncService";
import type { Video, WatchPartyRoom } from "../types";
import { SyncedVideoPlayer } from "./SyncedVideoPlayer";

interface ViewerVideoPlayerProps {
  room: WatchPartyRoom;
  currentVideo: Video | null;
  className?: string;
}

export const ViewerVideoPlayer: FC<ViewerVideoPlayerProps> = ({
  room,
  currentVideo,
  className = "",
}) => {
  const [localRoom, setLocalRoom] = useState(room);

  // Use sync service for real-time updates
  const { isConnected } = useSyncService({
    roomId: room.id,
    isHost: false,
    onRoomUpdate: (updatedRoom) => {
      setLocalRoom(updatedRoom);
    },
    onSyncRequired: (timestamp) => {
      // Sync is handled by the SyncedVideoPlayer component
      setLocalRoom((prev) => ({
        ...prev,
        currentTimestamp: timestamp,
      }));
    },
  });

  const handlePlaybackControl = useCallback(
    (action: "play" | "pause", timestamp: number) => {
      // Viewers cannot control playback
      console.log("Viewer attempted playback control:", action, timestamp);
    },
    [],
  );

  if (!currentVideo) {
    return (
      <div className={`bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center">
            <p className="text-white/60 text-lg mb-2">Waiting for host to start</p>
            <p className="text-white/40 text-sm">
              The host will begin the watch party soon
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <SyncedVideoPlayer
        video={currentVideo}
        room={localRoom}
        isHost={false}
        onPlaybackControl={handlePlaybackControl}
        className="w-full"
      />
      
      {/* Connection Status */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-gray-600">
            {isConnected ? "Connected" : "Reconnecting..."}
          </span>
        </div>
        {localRoom.settings.autoSync && (
          <span className="text-gray-500">Auto-sync enabled</span>
        )}
      </div>
    </div>
  );
};
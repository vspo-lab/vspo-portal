import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import type { FC } from "react";
import type { VideoOverlayProps } from "./types";

export const VideoOverlay: FC<VideoOverlayProps> = ({
  isBuffering,
  syncStatus,
  isHost,
}) => {
  return (
    <>
      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            <p className="text-white text-sm">Buffering...</p>
          </div>
        </div>
      )}

      {/* Sync Status (for viewers) */}
      {!isHost && !syncStatus.isSynced && (
        <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg flex items-center gap-2 animate-pulse">
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Syncing...</span>
        </div>
      )}

      {/* Sync Offset Warning */}
      {!isHost && syncStatus.syncOffset > 5 && syncStatus.isSynced && (
        <div className="absolute top-4 right-4 bg-yellow-600/80 text-white px-3 py-2 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">
            Synced ({Math.round(syncStatus.syncOffset)}s behind)
          </span>
        </div>
      )}
    </>
  );
};
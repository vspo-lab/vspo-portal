"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown, Shield, UserMinus, Volume2, VolumeX } from "lucide-react";
import { useCallback } from "react";
import { useWatchPartySync } from "../contexts/WatchPartySyncContext";
import type { Viewer } from "../types";

interface ViewerListProps {
  className?: string;
  showActions?: boolean;
}

export function ViewerList({ className = "", showActions = false }: ViewerListProps) {
  const {
    viewers,
    isHost,
    isModerator,
    kickViewer,
    muteViewer,
  } = useWatchPartySync();

  const handleKick = useCallback((viewerId: string) => {
    if (!isHost && !isModerator) return;
    if (confirm("このユーザーをキックしますか？")) {
      kickViewer(viewerId);
    }
  }, [isHost, isModerator, kickViewer]);

  const handleMute = useCallback((viewerId: string) => {
    if (!isHost && !isModerator) return;
    muteViewer(viewerId);
  }, [isHost, isModerator, muteViewer]);

  const getRoleBadge = (viewer: Viewer) => {
    if (viewer.role === "host") {
      return (
        <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
          <Crown className="w-3 h-3" />
          ホスト
        </span>
      );
    }
    if (viewer.role === "moderator") {
      return (
        <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          <Shield className="w-3 h-3" />
          モデレーター
        </span>
      );
    }
    return null;
  };

  const getViewerStatus = (viewer: Viewer) => {
    const now = Date.now();
    const lastSeenTime = new Date(viewer.lastSeen).getTime();
    const timeDiff = now - lastSeenTime;
    
    if (timeDiff < 5000) return "online"; // Active in last 5 seconds
    if (timeDiff < 30000) return "idle"; // Idle for up to 30 seconds
    return "offline"; // Offline after 30 seconds
  };

  const sortedViewers = [...viewers].sort((a, b) => {
    // Sort by role: host > moderator > viewer
    const roleOrder = { host: 0, moderator: 1, viewer: 2 };
    const roleCompare = roleOrder[a.role] - roleOrder[b.role];
    if (roleCompare !== 0) return roleCompare;
    
    // Then by online status
    const statusA = getViewerStatus(a);
    const statusB = getViewerStatus(b);
    if (statusA !== statusB) {
      if (statusA === "online") return -1;
      if (statusB === "online") return 1;
    }
    
    // Finally by join time
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">参加者</h3>
          <span className="text-sm text-gray-600">
            {viewers.filter(v => getViewerStatus(v) === "online").length} / {viewers.length}人
          </span>
        </div>
      </div>

      <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {sortedViewers.map((viewer) => {
            const status = getViewerStatus(viewer);
            const isOnline = status === "online";
            
            return (
              <motion.div
                key={viewer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-3 p-3 rounded-lg group hover:bg-gray-50 ${
                  !isOnline ? "opacity-60" : ""
                }`}
              >
                {/* Avatar with status indicator */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {viewer.name[0].toUpperCase()}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    status === "online" ? "bg-green-500" :
                    status === "idle" ? "bg-yellow-500" :
                    "bg-gray-400"
                  }`} />
                </div>

                {/* User info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">
                      {viewer.name}
                    </span>
                    {getRoleBadge(viewer)}
                    {viewer.isMuted && (
                      <VolumeX className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    参加: {new Date(viewer.joinedAt).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {/* Actions */}
                {showActions && (isHost || isModerator) && viewer.role !== "host" && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMute(viewer.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title={viewer.isMuted ? "ミュート解除" : "ミュート"}
                    >
                      {viewer.isMuted ? (
                        <VolumeX className="w-4 h-4 text-red-500" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleKick(viewer.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                      title="キック"
                    >
                      <UserMinus className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {viewers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            まだ参加者がいません
          </div>
        )}
      </div>
    </div>
  );
}
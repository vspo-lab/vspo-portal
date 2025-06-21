import {
  Ban,
  Clock,
  Crown,
  MoreVertical,
  Shield,
  UserX,
  Users,
} from "lucide-react";
import type { FC } from "react";
import { Button } from "../../../shared/components/presenters/Button";
import type { Viewer } from "../types";

interface ViewerManagementPanelProps {
  viewers: Viewer[];
  moderators: string[];
  bannedUsers: string[];
  onKickViewer: (viewerId: string) => void;
  onBanViewer: (viewerId: string) => void;
  onPromoteViewer: (viewerId: string) => void;
}

export const ViewerManagementPanel: FC<ViewerManagementPanelProps> = ({
  viewers,
  moderators,
  bannedUsers,
  onKickViewer,
  onBanViewer,
  onPromoteViewer,
}) => {
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const activeViewers = viewers.filter((v) => {
    const lastSeenTime = new Date(v.lastSeen).getTime();
    const now = new Date().getTime();
    return now - lastSeenTime < 300000; // Active in last 5 minutes
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Viewer Management</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            {activeViewers.length} active / {viewers.length} total
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Viewers</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold mt-1">{viewers.length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600">Moderators</span>
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-semibold mt-1">{moderators.length}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-600">Banned</span>
            <Ban className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-semibold mt-1">{bannedUsers.length}</p>
        </div>
      </div>

      {/* Viewer List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {viewers.length > 0 ? (
          viewers.map((viewer) => (
            <div
              key={viewer.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={viewer.avatar}
                    alt={viewer.name}
                    className="w-10 h-10 rounded-full"
                  />
                  {viewer.role === "host" && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {viewer.role === "moderator" && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {viewer.name}
                    {viewer.isMuted && (
                      <span className="ml-2 text-xs text-gray-500">
                        (Muted)
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>Joined {formatTimeAgo(viewer.joinedAt)}</span>
                  </div>
                </div>
              </div>

              {viewer.role !== "host" && (
                <div className="dropdown">
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="dropdown-content absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 hidden">
                    {viewer.role !== "moderator" && (
                      <button
                        onClick={() => onPromoteViewer(viewer.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Promote to Mod
                      </button>
                    )}
                    <button
                      onClick={() => onKickViewer(viewer.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-orange-600"
                    >
                      <UserX className="w-4 h-4" />
                      Kick from Room
                    </button>
                    <button
                      onClick={() => onBanViewer(viewer.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <Ban className="w-4 h-4" />
                      Ban User
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No viewers yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Share your room URL to invite viewers
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .dropdown:hover .dropdown-content {
          display: block;
        }
      `}</style>
    </div>
  );
};

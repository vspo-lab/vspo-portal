import {
  BarChart3,
  Copy,
  Eye,
  EyeOff,
  Link2,
  Loader2,
  MessageSquareOff,
  Monitor,
  PauseCircle,
  PlayCircle,
  Plus,
  Settings,
  Shield,
  SkipBack,
  SkipForward,
  Trash2,
  UserX,
  Users,
} from "lucide-react";
import type { FC } from "react";
import { Button } from "../../../../shared/components/presenters/Button";
import { AnalyticsDashboard } from "../../components/AnalyticsDashboard";
import { ChatModerationPanel } from "../../components/ChatModerationPanel";
import { OBSIntegrationPanel } from "../../components/OBSIntegrationPanel";
import { PlaybackControlPanel } from "../../components/PlaybackControlPanel";
import { PlaylistSelector } from "../../components/PlaylistSelector";
import { RoomSetupTab } from "../../components/RoomSetupTab";
import { VideoSelector } from "../../components/VideoSelector";
import { ViewerManagementPanel } from "../../components/ViewerManagementPanel";
import type {
  Analytics,
  ChatMessage,
  OBSSettings,
  Playlist,
  RoomSettings,
  Video,
  Viewer,
  WatchPartyRoom,
} from "../../types";

interface HostDashboardPresenterProps {
  activeTab: "setup" | "control" | "analytics";
  onTabChange: (tab: "setup" | "control" | "analytics") => void;
  room: WatchPartyRoom | null;
  isCreating: boolean;
  isConnected: boolean;
  roomSettings: RoomSettings;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  onCreateRoom: () => void;
  onDeleteRoom: () => void;
  onCopyRoomUrl: () => void;
  playlists: Playlist[];
  isLoadingPlaylists: boolean;
  selectedPlaylist: Playlist | null;
  onSelectPlaylist: (playlist: Playlist | null) => void;
  selectedVideos: Video[];
  onToggleVideo: (video: Video) => void;
  onReorderVideos: (videos: Video[]) => void;
  viewers: Viewer[];
  onKickViewer: (viewerId: string) => void;
  onBanViewer: (viewerId: string) => void;
  onPromoteViewer: (viewerId: string) => void;
  chatMessages: ChatMessage[];
  onDeleteMessage: (messageId: string) => void;
  onPlaybackControl: (
    action: "play" | "pause" | "skip" | "previous",
    timestamp?: number,
  ) => void;
  analytics: Analytics | null;
  isLoadingAnalytics: boolean;
  obsUrl: string | null;
  obsSettings: OBSSettings | null;
  onGenerateOBSUrl: () => void;
  onUpdateOBSSettings: (settings: Partial<OBSSettings>) => void;
  onCopyOBSUrl: () => void;
}

export const HostDashboardPresenter: FC<HostDashboardPresenterProps> = ({
  activeTab,
  onTabChange,
  room,
  isCreating,
  isConnected,
  roomSettings,
  onUpdateSettings,
  onCreateRoom,
  onDeleteRoom,
  onCopyRoomUrl,
  playlists,
  isLoadingPlaylists,
  selectedPlaylist,
  onSelectPlaylist,
  selectedVideos,
  onToggleVideo,
  onReorderVideos,
  viewers,
  onKickViewer,
  onBanViewer,
  onPromoteViewer,
  chatMessages,
  onDeleteMessage,
  onPlaybackControl,
  analytics,
  isLoadingAnalytics,
  obsUrl,
  obsSettings,
  onGenerateOBSUrl,
  onUpdateOBSSettings,
  onCopyOBSUrl,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Watch Party Host Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                {room
                  ? `Room: ${room.name}`
                  : "Create and manage your watch party"}
              </p>
            </div>
            {room && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span className="text-sm text-gray-600">
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onCopyRoomUrl}
                  className="flex items-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Copy Room URL
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onDeleteRoom}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Room
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => onTabChange("setup")}
                className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === "setup"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Settings className="w-4 h-4" />
                Setup
              </button>
              <button
                onClick={() => onTabChange("control")}
                disabled={!room}
                className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === "control"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                <PlayCircle className="w-4 h-4" />
                Control Room
              </button>
              <button
                onClick={() => onTabChange("analytics")}
                disabled={!room}
                className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === "analytics"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "setup" && (
            <>
              {/* Room Settings */}
              <RoomSetupTab
                roomSettings={roomSettings}
                onUpdateSettings={onUpdateSettings}
                isCreating={isCreating}
                onCreateRoom={onCreateRoom}
                hasRoom={!!room}
              />

              {/* Playlist Selection */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Content Selection
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PlaylistSelector
                    playlists={playlists}
                    selectedPlaylist={selectedPlaylist}
                    onSelectPlaylist={onSelectPlaylist}
                    isLoading={isLoadingPlaylists}
                  />
                  <VideoSelector
                    videos={selectedPlaylist?.videos || []}
                    selectedVideos={selectedVideos}
                    onToggleVideo={onToggleVideo}
                    onReorderVideos={onReorderVideos}
                  />
                </div>
              </div>

              {/* OBS Integration */}
              <OBSIntegrationPanel
                obsUrl={obsUrl}
                obsSettings={obsSettings}
                onGenerateUrl={onGenerateOBSUrl}
                onUpdateSettings={onUpdateOBSSettings}
                onCopyUrl={onCopyOBSUrl}
                hasRoom={!!room}
              />
            </>
          )}

          {activeTab === "control" && room && (
            <>
              {/* Playback Controls */}
              <PlaybackControlPanel
                room={room}
                currentVideo={room.currentVideo}
                playlist={selectedPlaylist}
                onPlaybackControl={onPlaybackControl}
                isConnected={isConnected}
              />

              {/* Viewer Management */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ViewerManagementPanel
                  viewers={viewers}
                  moderators={room.settings.moderators}
                  bannedUsers={room.settings.bannedUsers}
                  onKickViewer={onKickViewer}
                  onBanViewer={onBanViewer}
                  onPromoteViewer={onPromoteViewer}
                />

                {/* Chat Moderation */}
                <ChatModerationPanel
                  messages={chatMessages}
                  onDeleteMessage={onDeleteMessage}
                  isEnabled={room.settings.allowChat}
                />
              </div>
            </>
          )}

          {activeTab === "analytics" && room && (
            <AnalyticsDashboard
              analytics={analytics}
              isLoading={isLoadingAnalytics}
              roomName={room.name}
            />
          )}
        </div>
      </div>
    </div>
  );
};

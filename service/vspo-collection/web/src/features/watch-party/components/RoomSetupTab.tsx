import {
  Loader2,
  Lock,
  MessageSquare,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import type { FC } from "react";
import { Button } from "../../../shared/components/presenters/Button";
import type { RoomSettings } from "../types";

interface RoomSetupTabProps {
  roomSettings: RoomSettings;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  isCreating: boolean;
  onCreateRoom: () => void;
  hasRoom: boolean;
}

export const RoomSetupTab: FC<RoomSetupTabProps> = ({
  roomSettings,
  onUpdateSettings,
  isCreating,
  onCreateRoom,
  hasRoom,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold">Room Settings</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Name
            </label>
            <input
              type="text"
              value={roomSettings.name}
              onChange={(e) => onUpdateSettings({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My Awesome Watch Party"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={roomSettings.description}
              onChange={(e) =>
                onUpdateSettings({ description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe your watch party..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Viewers
            </label>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <input
                type="number"
                value={roomSettings.maxViewers}
                onChange={(e) =>
                  onUpdateSettings({
                    maxViewers: Number.parseInt(e.target.value) || 100,
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={1}
                max={1000}
              />
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Private Room
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={roomSettings.isPrivate}
                onChange={(e) =>
                  onUpdateSettings({ isPrivate: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Allow Chat
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={roomSettings.allowChat}
                onChange={(e) =>
                  onUpdateSettings({ allowChat: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Auto Sync Playback
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={roomSettings.autoSync}
                onChange={(e) =>
                  onUpdateSettings({ autoSync: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          {roomSettings.autoSync && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sync Interval (ms)
              </label>
              <input
                type="number"
                value={roomSettings.syncInterval}
                onChange={(e) =>
                  onUpdateSettings({
                    syncInterval: Number.parseInt(e.target.value) || 5000,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={1000}
                max={30000}
                step={1000}
              />
            </div>
          )}
        </div>
      </div>

      {!hasRoom && (
        <div className="mt-6 flex justify-end">
          <Button
            onClick={onCreateRoom}
            disabled={!roomSettings.name || isCreating}
            className="flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating Room...
              </>
            ) : (
              "Create Room"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

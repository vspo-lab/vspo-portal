import {
  Check,
  Copy,
  Eye,
  EyeOff,
  Layout,
  Monitor,
  Palette,
  Settings,
} from "lucide-react";
import type { FC } from "react";
import { Button } from "../../../shared/components/presenters/Button";
import type { OBSSettings } from "../types";

interface OBSIntegrationPanelProps {
  obsUrl: string | null;
  obsSettings: OBSSettings | null;
  onGenerateUrl: () => void;
  onUpdateSettings: (settings: Partial<OBSSettings>) => void;
  onCopyUrl: () => void;
  hasRoom: boolean;
}

export const OBSIntegrationPanel: FC<OBSIntegrationPanelProps> = ({
  obsUrl,
  obsSettings,
  onGenerateUrl,
  onUpdateSettings,
  onCopyUrl,
  hasRoom,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Monitor className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold">OBS Integration</h3>
      </div>

      {obsSettings && (
        <div className="space-y-6">
          {/* Resolution Settings */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Canvas Settings
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Width
                </label>
                <input
                  type="number"
                  value={obsSettings.width}
                  onChange={(e) =>
                    onUpdateSettings({
                      width: Number.parseInt(e.target.value) || 1920,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={640}
                  max={3840}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Height
                </label>
                <input
                  type="number"
                  value={obsSettings.height}
                  onChange={(e) =>
                    onUpdateSettings({
                      height: Number.parseInt(e.target.value) || 1080,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={360}
                  max={2160}
                />
              </div>
            </div>
          </div>

          {/* Display Options */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Display Options
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={obsSettings.showChat}
                  onChange={(e) =>
                    onUpdateSettings({ showChat: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show Chat</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={obsSettings.showViewers}
                  onChange={(e) =>
                    onUpdateSettings({ showViewers: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show Viewer List</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={obsSettings.chromaKey}
                  onChange={(e) =>
                    onUpdateSettings({ chromaKey: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Enable Chroma Key (Green Screen)
                </span>
              </label>
            </div>
          </div>

          {/* Layout Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Chat Position
              </label>
              <select
                value={obsSettings.chatPosition}
                onChange={(e) =>
                  onUpdateSettings({ chatPosition: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!obsSettings.showChat}
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Viewer List Position
              </label>
              <select
                value={obsSettings.viewerListPosition}
                onChange={(e) =>
                  onUpdateSettings({
                    viewerListPosition: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!obsSettings.showViewers}
              >
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>
          </div>

          {/* Style Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Background Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={obsSettings.backgroundColor}
                  onChange={(e) =>
                    onUpdateSettings({ backgroundColor: e.target.value })
                  }
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  disabled={obsSettings.chromaKey}
                />
                <input
                  type="text"
                  value={obsSettings.backgroundColor}
                  onChange={(e) =>
                    onUpdateSettings({ backgroundColor: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={obsSettings.chromaKey}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Chat Opacity
              </label>
              <input
                type="range"
                value={obsSettings.chatOpacity}
                onChange={(e) =>
                  onUpdateSettings({
                    chatOpacity: Number.parseFloat(e.target.value),
                  })
                }
                className="w-full"
                min="0"
                max="1"
                step="0.1"
                disabled={!obsSettings.showChat}
              />
              <span className="text-sm text-gray-500">
                {Math.round(obsSettings.chatOpacity * 100)}%
              </span>
            </div>
          </div>

          {/* Generate URL */}
          <div className="pt-4 border-t">
            <Button
              onClick={onGenerateUrl}
              disabled={!hasRoom}
              className="w-full mb-3"
            >
              Generate OBS Browser Source URL
            </Button>

            {obsUrl && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Browser Source URL
                    </p>
                    <p className="text-xs text-gray-600 break-all">{obsUrl}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onCopyUrl}
                    className="flex items-center gap-2 flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <p className="font-medium mb-1">OBS Setup Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Add a new Browser Source in OBS</li>
                    <li>Paste the URL above</li>
                    <li>
                      Set width to {obsSettings.width}px and height to{" "}
                      {obsSettings.height}px
                    </li>
                    <li>
                      Enable "Shutdown source when not visible" for performance
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!hasRoom && (
        <div className="text-center py-8">
          <Monitor className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Create a room first</p>
          <p className="text-sm text-gray-400 mt-1">
            OBS integration will be available after room creation
          </p>
        </div>
      )}
    </div>
  );
};

import { Check, Clock, ListVideo, Loader2, Plus } from "lucide-react";
import type { FC } from "react";
import { Button } from "../../../shared/components/presenters/Button";
import type { Playlist } from "../types";

interface PlaylistSelectorProps {
  playlists: Playlist[];
  selectedPlaylist: Playlist | null;
  onSelectPlaylist: (playlist: Playlist | null) => void;
  isLoading: boolean;
}

export const PlaylistSelector: FC<PlaylistSelectorProps> = ({
  playlists,
  selectedPlaylist,
  onSelectPlaylist,
  isLoading,
}) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">Select Playlist</h4>
        <Button
          variant="secondary"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {playlists.length > 0 ? (
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() =>
                  onSelectPlaylist(
                    selectedPlaylist?.id === playlist.id ? null : playlist,
                  )
                }
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  selectedPlaylist?.id === playlist.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <img
                  src={playlist.thumbnail}
                  alt={playlist.name}
                  className="w-16 h-10 object-cover rounded"
                />
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm text-gray-900">
                    {playlist.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <ListVideo className="w-3 h-3" />
                      {playlist.videos.length} videos
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(playlist.duration)}
                    </span>
                  </div>
                </div>
                {selectedPlaylist?.id === playlist.id && (
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                )}
              </button>
            ))
          ) : (
            <div className="text-center py-8">
              <ListVideo className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No playlists available</p>
              <p className="text-sm text-gray-400 mt-1">
                Create a new playlist to get started
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

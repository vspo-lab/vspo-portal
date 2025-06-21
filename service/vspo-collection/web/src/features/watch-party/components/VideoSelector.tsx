import {
  CheckSquare,
  Clock,
  GripVertical,
  Search,
  Square,
  X,
} from "lucide-react";
import { type FC, useState } from "react";
import type { Video } from "../types";

interface VideoSelectorProps {
  videos: Video[];
  selectedVideos: Video[];
  onToggleVideo: (video: Video) => void;
  onReorderVideos: (videos: Video[]) => void;
}

export const VideoSelector: FC<VideoSelectorProps> = ({
  videos,
  selectedVideos,
  onToggleVideo,
  onReorderVideos,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const filteredVideos = videos.filter(
    (video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.creatorName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newVideos = [...selectedVideos];
    const draggedVideo = newVideos[draggedIndex];
    newVideos.splice(draggedIndex, 1);
    newVideos.splice(index, 0, draggedVideo);

    onReorderVideos(newVideos);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">
          Video Queue ({selectedVideos.length} selected)
        </h4>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search videos..."
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        {/* Selected Videos (Reorderable) */}
        {selectedVideos.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected Videos (Drag to reorder)
            </p>
            <div className="space-y-2">
              {selectedVideos.map((video, index) => (
                <div
                  key={video.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg cursor-move"
                >
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 w-6">
                    {index + 1}
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
                  <button
                    onClick={() => onToggleVideo(video)}
                    className="p-1 hover:bg-blue-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Videos */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Available Videos
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredVideos.length > 0 ? (
              filteredVideos.map((video) => {
                const isSelected = selectedVideos.some(
                  (v) => v.id === video.id,
                );
                return (
                  <button
                    key={video.id}
                    onClick={() => onToggleVideo(video)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                      isSelected
                        ? "border-blue-300 bg-blue-50 opacity-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    disabled={isSelected}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-16 h-10 object-cover rounded"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {video.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{video.creatorName}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(video.duration)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No videos found
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Total Duration */}
      {selectedVideos.length > 0 && (
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Duration:</span>
          <span className="font-medium">
            {formatDuration(
              selectedVideos.reduce((sum, v) => sum + v.duration, 0),
            )}
          </span>
        </div>
      )}
    </div>
  );
};

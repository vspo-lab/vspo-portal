import { useCallback, useEffect, useState } from "react";
import type { Playlist, Video } from "../types";

interface UsePlaylistManagerReturn {
  playlists: Playlist[];
  isLoadingPlaylists: boolean;
  createPlaylist: (data: Partial<Playlist>) => Promise<Playlist | null>;
  updatePlaylist: (id: string, data: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addVideoToPlaylist: (playlistId: string, video: Video) => Promise<void>;
  removeVideoFromPlaylist: (
    playlistId: string,
    videoId: string,
  ) => Promise<void>;
  reorderPlaylistVideos: (
    playlistId: string,
    videoIds: string[],
  ) => Promise<void>;
}

export const usePlaylistManager = (): UsePlaylistManagerReturn => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    setIsLoadingPlaylists(true);
    try {
      // TODO: Implement API call
      const response = await fetch("/api/playlists");
      if (!response.ok) throw new Error("Failed to fetch playlists");

      const data = await response.json();
      setPlaylists(data);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const createPlaylist = useCallback(async (data: Partial<Playlist>) => {
    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create playlist");

      const newPlaylist = await response.json();
      setPlaylists((prev) => [...prev, newPlaylist]);
      return newPlaylist;
    } catch (error) {
      console.error("Error creating playlist:", error);
      return null;
    }
  }, []);

  const updatePlaylist = useCallback(
    async (id: string, data: Partial<Playlist>) => {
      try {
        const response = await fetch(`/api/playlists/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Failed to update playlist");

        const updatedPlaylist = await response.json();
        setPlaylists((prev) =>
          prev.map((p) => (p.id === id ? updatedPlaylist : p)),
        );
      } catch (error) {
        console.error("Error updating playlist:", error);
      }
    },
    [],
  );

  const deletePlaylist = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/playlists/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete playlist");

      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
  }, []);

  const addVideoToPlaylist = useCallback(
    async (playlistId: string, video: Video) => {
      try {
        const response = await fetch(`/api/playlists/${playlistId}/videos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: video.id }),
        });

        if (!response.ok) throw new Error("Failed to add video");

        setPlaylists((prev) =>
          prev.map((p) => {
            if (p.id === playlistId) {
              return {
                ...p,
                videos: [...p.videos, video],
                duration: p.duration + video.duration,
              };
            }
            return p;
          }),
        );
      } catch (error) {
        console.error("Error adding video to playlist:", error);
      }
    },
    [],
  );

  const removeVideoFromPlaylist = useCallback(
    async (playlistId: string, videoId: string) => {
      try {
        const response = await fetch(
          `/api/playlists/${playlistId}/videos/${videoId}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) throw new Error("Failed to remove video");

        setPlaylists((prev) =>
          prev.map((p) => {
            if (p.id === playlistId) {
              const removedVideo = p.videos.find((v) => v.id === videoId);
              return {
                ...p,
                videos: p.videos.filter((v) => v.id !== videoId),
                duration: p.duration - (removedVideo?.duration || 0),
              };
            }
            return p;
          }),
        );
      } catch (error) {
        console.error("Error removing video from playlist:", error);
      }
    },
    [],
  );

  const reorderPlaylistVideos = useCallback(
    async (playlistId: string, videoIds: string[]) => {
      try {
        const response = await fetch(`/api/playlists/${playlistId}/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoIds }),
        });

        if (!response.ok) throw new Error("Failed to reorder videos");

        setPlaylists((prev) =>
          prev.map((p) => {
            if (p.id === playlistId) {
              const reorderedVideos = videoIds
                .map((id) => p.videos.find((v) => v.id === id))
                .filter(Boolean) as Video[];
              return {
                ...p,
                videos: reorderedVideos,
              };
            }
            return p;
          }),
        );
      } catch (error) {
        console.error("Error reordering videos:", error);
      }
    },
    [],
  );

  return {
    playlists,
    isLoadingPlaylists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    reorderPlaylistVideos,
  };
};

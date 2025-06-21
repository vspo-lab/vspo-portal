import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type {
  ChatMessage,
  RoomSettings,
  Viewer,
  WatchPartyRoom,
} from "../types";

interface UseWatchPartyHostReturn {
  room: WatchPartyRoom | null;
  isCreating: boolean;
  isConnected: boolean;
  viewers: Viewer[];
  chatMessages: ChatMessage[];
  createRoom: (data: Partial<RoomSettings>) => Promise<WatchPartyRoom | null>;
  updateRoom: (roomId: string, data: Partial<RoomSettings>) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  kickViewer: (roomId: string, viewerId: string) => Promise<void>;
  banViewer: (roomId: string, viewerId: string) => Promise<void>;
  unbanViewer: (roomId: string, userId: string) => Promise<void>;
  promoteToModerator: (roomId: string, viewerId: string) => Promise<void>;
  demoteFromModerator: (roomId: string, viewerId: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  deleteChatMessage: (roomId: string, messageId: string) => Promise<void>;
  syncPlayback: (timestamp: number) => Promise<void>;
  controlPlayback: (
    roomId: string,
    action: string,
    timestamp?: number,
  ) => Promise<void>;
}

export const useWatchPartyHost = (): UseWatchPartyHostReturn => {
  const router = useRouter();
  const [room, setRoom] = useState<WatchPartyRoom | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!room) return;

    // TODO: Implement WebSocket connection
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/room/${room.id}`,
    );

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "viewer-joined":
          setViewers((prev) => [...prev, data.viewer]);
          break;
        case "viewer-left":
          setViewers((prev) => prev.filter((v) => v.id !== data.viewerId));
          break;
        case "chat-message":
          setChatMessages((prev) => [...prev, data.message]);
          break;
        case "room-updated":
          setRoom(data.room);
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [room?.id]);

  const createRoom = useCallback(async (data: Partial<RoomSettings>) => {
    setIsCreating(true);
    try {
      // TODO: Implement API call
      const response = await fetch("/api/watch-party/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create room");

      const newRoom = await response.json();
      setRoom(newRoom);
      return newRoom;
    } catch (error) {
      console.error("Error creating room:", error);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateRoom = useCallback(
    async (roomId: string, data: Partial<RoomSettings>) => {
      try {
        const response = await fetch(`/api/watch-party/rooms/${roomId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Failed to update room");

        const updatedRoom = await response.json();
        setRoom(updatedRoom);
      } catch (error) {
        console.error("Error updating room:", error);
      }
    },
    [],
  );

  const deleteRoom = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`/api/watch-party/rooms/${roomId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete room");

      setRoom(null);
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  }, []);

  const kickViewer = useCallback(async (roomId: string, viewerId: string) => {
    try {
      await fetch(`/api/watch-party/rooms/${roomId}/viewers/${viewerId}/kick`, {
        method: "POST",
      });

      setViewers((prev) => prev.filter((v) => v.id !== viewerId));
    } catch (error) {
      console.error("Error kicking viewer:", error);
    }
  }, []);

  const banViewer = useCallback(
    async (roomId: string, viewerId: string) => {
      try {
        await fetch(
          `/api/watch-party/rooms/${roomId}/viewers/${viewerId}/ban`,
          {
            method: "POST",
          },
        );

        setViewers((prev) => prev.filter((v) => v.id !== viewerId));
        if (room) {
          setRoom({
            ...room,
            settings: {
              ...room.settings,
              bannedUsers: [...room.settings.bannedUsers, viewerId],
            },
          });
        }
      } catch (error) {
        console.error("Error banning viewer:", error);
      }
    },
    [room],
  );

  const unbanViewer = useCallback(
    async (roomId: string, userId: string) => {
      try {
        await fetch(
          `/api/watch-party/rooms/${roomId}/viewers/${userId}/unban`,
          {
            method: "POST",
          },
        );

        if (room) {
          setRoom({
            ...room,
            settings: {
              ...room.settings,
              bannedUsers: room.settings.bannedUsers.filter(
                (id) => id !== userId,
              ),
            },
          });
        }
      } catch (error) {
        console.error("Error unbanning viewer:", error);
      }
    },
    [room],
  );

  const promoteToModerator = useCallback(
    async (roomId: string, viewerId: string) => {
      try {
        await fetch(
          `/api/watch-party/rooms/${roomId}/viewers/${viewerId}/promote`,
          {
            method: "POST",
          },
        );

        setViewers((prev) =>
          prev.map((v) =>
            v.id === viewerId ? { ...v, role: "moderator" as const } : v,
          ),
        );

        if (room) {
          setRoom({
            ...room,
            settings: {
              ...room.settings,
              moderators: [...room.settings.moderators, viewerId],
            },
          });
        }
      } catch (error) {
        console.error("Error promoting viewer:", error);
      }
    },
    [room],
  );

  const demoteFromModerator = useCallback(
    async (roomId: string, viewerId: string) => {
      try {
        await fetch(
          `/api/watch-party/rooms/${roomId}/viewers/${viewerId}/demote`,
          {
            method: "POST",
          },
        );

        setViewers((prev) =>
          prev.map((v) =>
            v.id === viewerId ? { ...v, role: "viewer" as const } : v,
          ),
        );

        if (room) {
          setRoom({
            ...room,
            settings: {
              ...room.settings,
              moderators: room.settings.moderators.filter(
                (id) => id !== viewerId,
              ),
            },
          });
        }
      } catch (error) {
        console.error("Error demoting moderator:", error);
      }
    },
    [room],
  );

  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!room) return;

      try {
        await fetch(`/api/watch-party/rooms/${room.id}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [room],
  );

  const deleteChatMessage = useCallback(
    async (roomId: string, messageId: string) => {
      try {
        await fetch(`/api/watch-party/rooms/${roomId}/chat/${messageId}`, {
          method: "DELETE",
        });

        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isDeleted: true } : msg,
          ),
        );
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    },
    [],
  );

  const syncPlayback = useCallback(
    async (timestamp: number) => {
      if (!room) return;

      try {
        await fetch(`/api/watch-party/rooms/${room.id}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timestamp }),
        });
      } catch (error) {
        console.error("Error syncing playback:", error);
      }
    },
    [room],
  );

  const controlPlayback = useCallback(
    async (roomId: string, action: string, timestamp?: number) => {
      try {
        await fetch(`/api/watch-party/rooms/${roomId}/playback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, timestamp }),
        });
      } catch (error) {
        console.error("Error controlling playback:", error);
      }
    },
    [],
  );

  return {
    room,
    isCreating,
    isConnected,
    viewers,
    chatMessages,
    createRoom,
    updateRoom,
    deleteRoom,
    kickViewer,
    banViewer,
    unbanViewer,
    promoteToModerator,
    demoteFromModerator,
    sendChatMessage,
    deleteChatMessage,
    syncPlayback,
    controlPlayback,
  };
};

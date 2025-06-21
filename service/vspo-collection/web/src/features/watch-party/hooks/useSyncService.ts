import { useCallback, useEffect, useRef, useState } from "react";
import type { WatchPartyRoom } from "../types";

interface SyncServiceOptions {
  roomId: string;
  isHost: boolean;
  onRoomUpdate?: (room: WatchPartyRoom) => void;
  onSyncRequired?: (timestamp: number) => void;
}

interface SyncServiceReturn {
  isConnected: boolean;
  sendSync: (timestamp: number, force?: boolean) => void;
  sendPlaybackControl: (action: "play" | "pause", timestamp: number) => void;
  syncOffset: number;
  lastSyncTime: number;
}

export const useSyncService = ({
  roomId,
  isHost,
  onRoomUpdate,
  onSyncRequired,
}: SyncServiceOptions): SyncServiceReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [syncOffset, setSyncOffset] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentTimestampRef = useRef<number>(0);

  // WebSocket connection management
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8787"}/watch-party/${roomId}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("Sync service connected");
      setIsConnected(true);
      
      // Send initial join message
      wsRef.current?.send(
        JSON.stringify({
          type: "join",
          isHost,
          roomId,
        }),
      );

      // Start ping interval
      pingIntervalRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "room-update":
            onRoomUpdate?.(data.room);
            break;

          case "sync-update":
            if (!isHost && data.timestamp !== undefined) {
              const now = Date.now();
              const offset = Math.abs(data.timestamp - lastSentTimestampRef.current);
              setSyncOffset(offset);
              setLastSyncTime(now);
              onSyncRequired?.(data.timestamp);
            }
            break;

          case "playback-control":
            if (!isHost) {
              onSyncRequired?.(data.timestamp);
              // Additional playback control handling can be added here
            }
            break;

          case "pong":
            // Server is alive
            break;

          default:
            console.log("Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current.onclose = () => {
      console.log("Sync service disconnected");
      setIsConnected(false);

      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      // Attempt to reconnect after 3 seconds
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [roomId, isHost, onRoomUpdate, onSyncRequired]);

  // Send sync update
  const sendSync = useCallback(
    (timestamp: number, force = false) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      if (!isHost && !force) return;

      // Throttle sync updates to avoid spam
      const now = Date.now();
      if (!force && now - lastSyncTime < 1000) return;

      lastSentTimestampRef.current = timestamp;
      setLastSyncTime(now);

      wsRef.current.send(
        JSON.stringify({
          type: "sync",
          timestamp,
          roomId,
        }),
      );
    },
    [isHost, lastSyncTime, roomId],
  );

  // Send playback control
  const sendPlaybackControl = useCallback(
    (action: "play" | "pause", timestamp: number) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      if (!isHost) return;

      wsRef.current.send(
        JSON.stringify({
          type: "playback-control",
          action,
          timestamp,
          roomId,
        }),
      );
    },
    [isHost, roomId],
  );

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    sendSync,
    sendPlaybackControl,
    syncOffset,
    lastSyncTime,
  };
};
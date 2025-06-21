"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { syncService, type SyncEvent, type RoomState, type PlaybackState } from "../services/syncService";
import type {
  WatchPartyRoom,
  WatchPartyVideo,
  Viewer,
  ChatMessage,
  WatchPartyReaction,
} from "../types";

interface WatchPartySyncContextValue {
  // Room state
  room: RoomState | null;
  isConnected: boolean;
  isHost: boolean;
  isModerator: boolean;
  
  // Playback state
  playbackState: PlaybackState | null;
  
  // Real-time data
  viewers: Viewer[];
  chatMessages: ChatMessage[];
  reactions: WatchPartyReaction[];
  
  // Actions
  joinRoom: (roomId: string, userId: string, roomData?: Partial<WatchPartyRoom>) => Promise<void>;
  leaveRoom: () => Promise<void>;
  
  // Playback controls (host/moderator only)
  play: () => void;
  pause: () => void;
  seek: (position: number) => void;
  changeVideo: (video: WatchPartyVideo) => void;
  
  // Communication
  sendMessage: (content: string) => void;
  sendReaction: (type: WatchPartyReaction["type"]) => void;
  
  // Moderation (host/moderator only)
  kickViewer: (viewerId: string) => void;
  muteViewer: (viewerId: string) => void;
  
  // Sync state
  lastSyncTime: number;
  syncDelay: number;
}

const WatchPartySyncContext = createContext<WatchPartySyncContextValue | null>(null);

interface WatchPartySyncProviderProps {
  children: React.ReactNode;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export function WatchPartySyncProvider({
  children,
  userId,
  userName,
  userAvatar,
}: WatchPartySyncProviderProps) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<WatchPartyReaction[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [syncDelay, setSyncDelay] = useState(0);
  
  const roomIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  const isHost = room?.hostId === userId;
  const isModerator = room?.settings.moderators.includes(userId) || isHost;

  // Handle sync events
  const handleSyncEvent = useCallback((event: SyncEvent) => {
    const eventDelay = Date.now() - event.timestamp;
    setSyncDelay(eventDelay);
    setLastSyncTime(Date.now());

    switch (event.type) {
      case "room-state":
        const updatedRoom = syncService.getRoomState(event.roomId);
        if (updatedRoom) {
          setRoom(updatedRoom);
          setViewers(updatedRoom.viewers);
          setChatMessages(updatedRoom.chatMessages);
          setReactions(updatedRoom.reactions);
          setPlaybackState(updatedRoom.playbackState);
        }
        break;
        
      case "playback-control":
        setPlaybackState(prev => prev ? {
          ...prev,
          isPlaying: event.data.isPlaying,
          lastSyncTime: event.timestamp,
        } : null);
        break;
        
      case "seek":
        setPlaybackState(prev => prev ? {
          ...prev,
          currentTime: event.data.position,
          lastSyncTime: event.timestamp,
        } : null);
        break;
        
      case "video-change":
        setRoom(prev => prev ? {
          ...prev,
          currentVideo: event.data.video,
        } : null);
        setPlaybackState(prev => prev ? {
          ...prev,
          currentTime: 0,
          isPlaying: false,
          lastSyncTime: event.timestamp,
        } : null);
        break;
        
      case "chat-message":
        setChatMessages(prev => [...prev, event.data]);
        break;
        
      case "reaction":
        setReactions(prev => [...prev, event.data]);
        // Auto-remove reaction after animation
        setTimeout(() => {
          setReactions(prev => prev.filter(r => r.id !== event.data.id));
        }, 5000);
        break;
        
      case "viewer-join":
        setViewers(prev => {
          const existing = prev.findIndex(v => v.id === event.data.viewer.id);
          if (existing === -1) {
            return [...prev, event.data.viewer];
          }
          const updated = [...prev];
          updated[existing] = event.data.viewer;
          return updated;
        });
        break;
        
      case "viewer-leave":
        setViewers(prev => prev.filter(v => v.id !== event.data.viewerId));
        break;
        
      case "sync-request":
        // Update playback state from sync
        if (event.data.playbackState) {
          setPlaybackState(event.data.playbackState);
        }
        break;
        
      case "moderator-action":
        if (event.data.action === "kick" && event.data.targetId === userId) {
          // User was kicked
          leaveRoom();
          alert("You have been kicked from the room");
        }
        break;
    }
  }, [userId]);

  // Join room
  const joinRoom = useCallback(async (
    roomId: string,
    userIdParam: string,
    roomData?: Partial<WatchPartyRoom>
  ) => {
    try {
      setIsConnected(false);
      
      // Create viewer object
      const viewer: Viewer = {
        id: userIdParam,
        name: userName,
        avatarUrl: userAvatar || null,
        role: roomData?.hostId === userIdParam ? "host" : "viewer",
        joinedAt: new Date(),
        lastSeen: new Date(),
        isMuted: false,
      };

      // Join room in sync service
      const roomState = await syncService.joinRoom(roomId, userIdParam, roomData);
      
      // Add viewer to room
      syncService.sendEvent({
        type: "viewer-join",
        roomId,
        timestamp: Date.now(),
        data: { viewer },
      });

      // Subscribe to updates
      unsubscribeRef.current = syncService.subscribeToRoom(roomId, handleSyncEvent);
      roomIdRef.current = roomId;
      
      // Set initial state
      setRoom(roomState);
      setViewers(roomState.viewers);
      setChatMessages(roomState.chatMessages);
      setReactions(roomState.reactions);
      setPlaybackState(roomState.playbackState);
      setIsConnected(true);
      
      // Send initial sync request
      syncService.sendEvent({
        type: "room-state",
        roomId,
        timestamp: Date.now(),
        data: {},
      });
    } catch (error) {
      console.error("Failed to join room:", error);
      setIsConnected(false);
    }
  }, [userName, userAvatar, handleSyncEvent]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!roomIdRef.current) return;
    
    try {
      await syncService.leaveRoom(roomIdRef.current, userId);
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      setRoom(null);
      setViewers([]);
      setChatMessages([]);
      setReactions([]);
      setPlaybackState(null);
      setIsConnected(false);
      roomIdRef.current = null;
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  }, [userId]);

  // Playback controls
  const play = useCallback(() => {
    if (!room || !isModerator) return;
    syncService.controlPlayback(room.id, userId, true);
  }, [room, userId, isModerator]);

  const pause = useCallback(() => {
    if (!room || !isModerator) return;
    syncService.controlPlayback(room.id, userId, false);
  }, [room, userId, isModerator]);

  const seek = useCallback((position: number) => {
    if (!room || !isModerator) return;
    syncService.seekTo(room.id, userId, position);
  }, [room, userId, isModerator]);

  const changeVideo = useCallback((video: WatchPartyVideo) => {
    if (!room || !isModerator) return;
    syncService.changeVideo(room.id, userId, video);
  }, [room, userId, isModerator]);

  // Communication
  const sendMessage = useCallback((content: string) => {
    if (!room) return;
    
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      userId,
      userName,
      userAvatar: userAvatar || "",
      content,
      timestamp: new Date(),
      isDeleted: false,
    };
    
    syncService.sendChatMessage(room.id, message);
  }, [room, userId, userName, userAvatar]);

  const sendReaction = useCallback((type: WatchPartyReaction["type"]) => {
    if (!room) return;
    
    const reaction: WatchPartyReaction = {
      id: `${Date.now()}-${Math.random()}`,
      userId,
      userName,
      type,
      timestamp: new Date().toISOString(),
    };
    
    syncService.sendReaction(room.id, reaction);
  }, [room, userId, userName]);

  // Moderation
  const kickViewer = useCallback((viewerId: string) => {
    if (!room || !isHost) return;
    syncService.kickViewer(room.id, userId, viewerId);
  }, [room, userId, isHost]);

  const muteViewer = useCallback((viewerId: string) => {
    if (!room || !isModerator) return;
    syncService.muteViewer(room.id, userId, viewerId);
  }, [room, userId, isModerator]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomIdRef.current) {
        syncService.leaveRoom(roomIdRef.current, userId);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId]);

  // Sync playback time
  useEffect(() => {
    if (!playbackState || !playbackState.isPlaying) return;

    const interval = setInterval(() => {
      setPlaybackState(prev => {
        if (!prev || !prev.isPlaying) return prev;
        
        const elapsed = (Date.now() - prev.lastSyncTime) / 1000;
        return {
          ...prev,
          currentTime: prev.currentTime + elapsed * prev.playbackRate,
          lastSyncTime: Date.now(),
        };
      });
    }, 100); // Update every 100ms for smooth playback

    return () => clearInterval(interval);
  }, [playbackState?.isPlaying]);

  const value: WatchPartySyncContextValue = {
    room,
    isConnected,
    isHost,
    isModerator,
    playbackState,
    viewers,
    chatMessages,
    reactions,
    joinRoom,
    leaveRoom,
    play,
    pause,
    seek,
    changeVideo,
    sendMessage,
    sendReaction,
    kickViewer,
    muteViewer,
    lastSyncTime,
    syncDelay,
  };

  return (
    <WatchPartySyncContext.Provider value={value}>
      {children}
    </WatchPartySyncContext.Provider>
  );
}

export function useWatchPartySync() {
  const context = useContext(WatchPartySyncContext);
  if (!context) {
    throw new Error("useWatchPartySync must be used within WatchPartySyncProvider");
  }
  return context;
}
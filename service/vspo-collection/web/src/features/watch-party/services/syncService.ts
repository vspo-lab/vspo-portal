import { EventEmitter } from "events";
import type {
  WatchPartyRoom,
  WatchPartyVideo,
  Viewer,
  ChatMessage,
  WatchPartyReaction,
} from "../types";

export interface SyncEvent {
  type:
    | "room-state"
    | "playback-control"
    | "video-change"
    | "viewer-join"
    | "viewer-leave"
    | "chat-message"
    | "reaction"
    | "seek"
    | "sync-request"
    | "host-control"
    | "moderator-action";
  roomId: string;
  timestamp: number;
  data: any;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  volume: number;
  lastSyncTime: number;
}

export interface RoomState extends WatchPartyRoom {
  playbackState: PlaybackState;
  reactions: WatchPartyReaction[];
  chatMessages: ChatMessage[];
}

class SyncService extends EventEmitter {
  private rooms: Map<string, RoomState> = new Map();
  private connections: Map<string, Set<string>> = new Map(); // roomId -> Set<userId>
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private messageBuffer: Map<string, SyncEvent[]> = new Map();

  // Simulated network delay for realism
  private readonly NETWORK_DELAY = 50; // ms
  private readonly SYNC_INTERVAL = 5000; // ms
  private readonly BUFFER_FLUSH_INTERVAL = 100; // ms

  constructor() {
    super();
    this.startBufferFlush();
  }

  private startBufferFlush() {
    setInterval(() => {
      this.messageBuffer.forEach((events, roomId) => {
        if (events.length > 0) {
          const batchedEvents = [...events];
          this.messageBuffer.set(roomId, []);
          
          // Process batched events
          batchedEvents.forEach(event => {
            this.processEvent(event);
          });
        }
      });
    }, this.BUFFER_FLUSH_INTERVAL);
  }

  private processEvent(event: SyncEvent) {
    const room = this.rooms.get(event.roomId);
    if (!room) return;

    switch (event.type) {
      case "playback-control":
        this.handlePlaybackControl(room, event.data);
        break;
      case "seek":
        this.handleSeek(room, event.data);
        break;
      case "video-change":
        this.handleVideoChange(room, event.data);
        break;
      case "chat-message":
        this.handleChatMessage(room, event.data);
        break;
      case "reaction":
        this.handleReaction(room, event.data);
        break;
      case "viewer-join":
        this.handleViewerJoin(room, event.data);
        break;
      case "viewer-leave":
        this.handleViewerLeave(room, event.data);
        break;
    }

    // Broadcast to all connected users
    this.broadcast(event.roomId, event);
  }

  // Create or join a room
  async joinRoom(roomId: string, userId: string, roomData?: Partial<WatchPartyRoom>): Promise<RoomState> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let room = this.rooms.get(roomId);
        
        if (!room && roomData) {
          // Create new room
          room = {
            ...roomData,
            id: roomId,
            viewers: [],
            playbackState: {
              isPlaying: false,
              currentTime: 0,
              playbackRate: 1,
              volume: 1,
              lastSyncTime: Date.now(),
            },
            reactions: [],
            chatMessages: [],
          } as RoomState;
          
          this.rooms.set(roomId, room);
          this.startSyncInterval(roomId);
        }

        if (!room) {
          throw new Error("Room not found and no room data provided");
        }

        // Add user to connections
        if (!this.connections.has(roomId)) {
          this.connections.set(roomId, new Set());
        }
        this.connections.get(roomId)!.add(userId);

        // Emit join event
        this.emit("viewer-joined", { roomId, userId });

        resolve(room);
      }, this.NETWORK_DELAY);
    });
  }

  // Leave a room
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const connections = this.connections.get(roomId);
        if (connections) {
          connections.delete(userId);
          if (connections.size === 0) {
            this.connections.delete(roomId);
            this.stopSyncInterval(roomId);
          }
        }

        this.emit("viewer-left", { roomId, userId });
        resolve();
      }, this.NETWORK_DELAY);
    });
  }

  // Send an event (buffered for batching)
  sendEvent(event: SyncEvent): void {
    if (!this.messageBuffer.has(event.roomId)) {
      this.messageBuffer.set(event.roomId, []);
    }
    this.messageBuffer.get(event.roomId)!.push(event);
  }

  // Control playback (play/pause)
  controlPlayback(roomId: string, userId: string, isPlaying: boolean): void {
    this.sendEvent({
      type: "playback-control",
      roomId,
      timestamp: Date.now(),
      data: { userId, isPlaying },
    });
  }

  // Seek to position
  seekTo(roomId: string, userId: string, position: number): void {
    this.sendEvent({
      type: "seek",
      roomId,
      timestamp: Date.now(),
      data: { userId, position },
    });
  }

  // Change video
  changeVideo(roomId: string, userId: string, video: WatchPartyVideo): void {
    this.sendEvent({
      type: "video-change",
      roomId,
      timestamp: Date.now(),
      data: { userId, video },
    });
  }

  // Send chat message
  sendChatMessage(roomId: string, message: ChatMessage): void {
    this.sendEvent({
      type: "chat-message",
      roomId,
      timestamp: Date.now(),
      data: message,
    });
  }

  // Send reaction
  sendReaction(roomId: string, reaction: WatchPartyReaction): void {
    this.sendEvent({
      type: "reaction",
      roomId,
      timestamp: Date.now(),
      data: reaction,
    });
  }

  // Get room state
  getRoomState(roomId: string): RoomState | null {
    return this.rooms.get(roomId) || null;
  }

  // Subscribe to room updates
  subscribeToRoom(roomId: string, callback: (event: SyncEvent) => void): () => void {
    const eventHandler = (event: SyncEvent) => {
      if (event.roomId === roomId) {
        callback(event);
      }
    };

    this.on("sync-update", eventHandler);

    // Return unsubscribe function
    return () => {
      this.off("sync-update", eventHandler);
    };
  }

  // Private methods for handling events
  private handlePlaybackControl(room: RoomState, data: { userId: string; isPlaying: boolean }) {
    room.playbackState.isPlaying = data.isPlaying;
    room.playbackState.lastSyncTime = Date.now();
    room.isPlaying = data.isPlaying;
  }

  private handleSeek(room: RoomState, data: { userId: string; position: number }) {
    room.playbackState.currentTime = data.position;
    room.playbackState.lastSyncTime = Date.now();
    room.currentTimestamp = data.position;
  }

  private handleVideoChange(room: RoomState, data: { userId: string; video: WatchPartyVideo }) {
    room.currentVideo = data.video;
    room.playbackState.currentTime = 0;
    room.playbackState.isPlaying = false;
    room.playbackState.lastSyncTime = Date.now();
  }

  private handleChatMessage(room: RoomState, message: ChatMessage) {
    room.chatMessages.push(message);
    
    // Keep only last 1000 messages
    if (room.chatMessages.length > 1000) {
      room.chatMessages = room.chatMessages.slice(-1000);
    }
  }

  private handleReaction(room: RoomState, reaction: WatchPartyReaction) {
    room.reactions.push(reaction);
    
    // Remove reactions older than 10 seconds
    const cutoffTime = Date.now() - 10000;
    room.reactions = room.reactions.filter(
      r => new Date(r.timestamp).getTime() > cutoffTime
    );
  }

  private handleViewerJoin(room: RoomState, data: { viewer: Viewer }) {
    const existingIndex = room.viewers.findIndex(v => v.id === data.viewer.id);
    if (existingIndex === -1) {
      room.viewers.push(data.viewer);
    } else {
      room.viewers[existingIndex] = data.viewer;
    }
  }

  private handleViewerLeave(room: RoomState, data: { viewerId: string }) {
    room.viewers = room.viewers.filter(v => v.id !== data.viewerId);
  }

  private broadcast(roomId: string, event: SyncEvent) {
    // Simulate network broadcast with slight delay
    setTimeout(() => {
      this.emit("sync-update", event);
    }, Math.random() * 20); // Random 0-20ms jitter for realism
  }

  private startSyncInterval(roomId: string) {
    const interval = setInterval(() => {
      const room = this.rooms.get(roomId);
      if (!room) return;

      // Update current time based on playback state
      if (room.playbackState.isPlaying) {
        const elapsed = (Date.now() - room.playbackState.lastSyncTime) / 1000;
        room.playbackState.currentTime += elapsed * room.playbackState.playbackRate;
        room.playbackState.lastSyncTime = Date.now();
        
        // Update room timestamp
        room.currentTimestamp = room.playbackState.currentTime;
      }

      // Broadcast sync update
      this.broadcast(roomId, {
        type: "sync-request",
        roomId,
        timestamp: Date.now(),
        data: {
          playbackState: room.playbackState,
          currentVideo: room.currentVideo,
        },
      });
    }, this.SYNC_INTERVAL);

    this.syncIntervals.set(roomId, interval);
  }

  private stopSyncInterval(roomId: string) {
    const interval = this.syncIntervals.get(roomId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(roomId);
    }
    
    // Clean up room data
    this.rooms.delete(roomId);
    this.messageBuffer.delete(roomId);
  }

  // Host control methods
  kickViewer(roomId: string, hostId: string, viewerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== hostId) return;

    this.sendEvent({
      type: "moderator-action",
      roomId,
      timestamp: Date.now(),
      data: { action: "kick", targetId: viewerId, moderatorId: hostId },
    });
  }

  muteViewer(roomId: string, moderatorId: string, viewerId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const viewer = room.viewers.find(v => v.id === viewerId);
    if (viewer) {
      viewer.isMuted = true;
      this.sendEvent({
        type: "moderator-action",
        roomId,
        timestamp: Date.now(),
        data: { action: "mute", targetId: viewerId, moderatorId },
      });
    }
  }

  // Cleanup
  destroy() {
    this.syncIntervals.forEach(interval => clearInterval(interval));
    this.rooms.clear();
    this.connections.clear();
    this.messageBuffer.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const syncService = new SyncService();
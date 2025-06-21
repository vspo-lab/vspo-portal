"use client";

import { useEffect } from "react";
import { WatchPartySyncProvider, useWatchPartySync } from "../contexts/WatchPartySyncContext";
import { ChatSync } from "../components/ChatSync";
import { ReactionDisplay } from "../components/ReactionDisplay";
import { ViewerList } from "../components/ViewerList";
import { PlaybackControlPanel } from "../components/PlaybackControlPanel";
import type { Playlist, Video, WatchPartyRoom } from "../types";

// Example component showing how to use all sync features
function WatchPartySyncExample() {
  const {
    room,
    isConnected,
    joinRoom,
    sendReaction,
    playbackState,
    isHost,
  } = useWatchPartySync();

  // Auto-join example room on mount
  useEffect(() => {
    if (!room) {
      const exampleRoom: Partial<WatchPartyRoom> = {
        id: "example-room",
        name: "Example Watch Party",
        description: "This is a demo of the sync system",
        hostId: "user-123",
        settings: {
          name: "Example Watch Party",
          description: "Demo room",
          maxViewers: 100,
          isPrivate: false,
          allowChat: true,
          autoSync: true,
          syncInterval: 5000,
          moderators: [],
          bannedUsers: [],
        },
        currentVideo: {
          id: "video-1",
          title: "Example Video",
          channelName: "Example Channel",
          thumbnailUrl: "https://via.placeholder.com/320x180",
          platform: "youtube",
          duration: 600,
          currentTime: 0,
        },
        currentTimestamp: 0,
        playbackState: "paused",
        viewers: [],
        isPlaying: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      joinRoom("example-room", "user-123", exampleRoom);
    }
  }, [room, joinRoom]);

  // Example playlist
  const examplePlaylist: Playlist = {
    id: "playlist-1",
    name: "Example Playlist",
    description: "Demo playlist",
    thumbnail: "https://via.placeholder.com/200x200",
    videos: [
      {
        id: "video-1",
        title: "Example Video 1",
        description: "First video",
        thumbnail: "https://via.placeholder.com/320x180",
        url: "https://example.com/video1",
        platform: "youtube",
        duration: 600,
        creatorId: "creator-1",
        creatorName: "Example Creator",
        createdAt: new Date(),
      },
      {
        id: "video-2",
        title: "Example Video 2",
        description: "Second video",
        thumbnail: "https://via.placeholder.com/320x180",
        url: "https://example.com/video2",
        platform: "youtube",
        duration: 480,
        creatorId: "creator-1",
        creatorName: "Example Creator",
        createdAt: new Date(),
      },
    ],
    duration: 1080,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const currentVideo = examplePlaylist.videos[0];

  // Reaction buttons
  const handleReaction = (type: "heart" | "laugh" | "wow" | "fire" | "clap") => {
    sendReaction(type);
  };

  if (!room) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Watch Party Sync Example</h1>
      
      {/* Connection status */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm">
            {isConnected ? "Connected" : "Disconnected"} | 
            Room: {room.name} | 
            Role: {isHost ? "Host" : "Viewer"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video player placeholder */}
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <div className="text-white text-center">
              <p className="text-xl mb-2">Video Player Area</p>
              <p className="text-sm opacity-75">
                {playbackState?.isPlaying ? "Playing" : "Paused"} at {Math.floor(playbackState?.currentTime || 0)}s
              </p>
            </div>
          </div>

          {/* Playback controls */}
          <PlaybackControlPanel
            room={room}
            currentVideo={currentVideo}
            playlist={examplePlaylist}
            onPlaybackControl={(action) => console.log("Playback:", action)}
            isConnected={isConnected}
          />

          {/* Reaction buttons */}
          <div className="bg-white rounded-lg p-4 shadow">
            <h3 className="font-semibold mb-3">Send Reactions</h3>
            <div className="flex gap-2">
              {(["heart", "laugh", "wow", "fire", "clap"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {{
                    heart: "❤️",
                    laugh: "😂",
                    wow: "😮",
                    fire: "🔥",
                    clap: "👏",
                  }[type]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Viewer list */}
          <ViewerList showActions={isHost} />

          {/* Chat */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Chat</h3>
            </div>
            <ChatSync maxHeight="300px" />
          </div>
        </div>
      </div>

      {/* Floating reactions */}
      <ReactionDisplay position="bottom-right" />
    </div>
  );
}

// Export wrapped component
export function SyncIntegrationExample() {
  return (
    <WatchPartySyncProvider
      userId="user-123"
      userName="Demo User"
      userAvatar=""
    >
      <WatchPartySyncExample />
    </WatchPartySyncProvider>
  );
}
export interface WatchPartyRoom {
  id: string;
  name: string;
  description: string;
  hostId: string;
  settings: RoomSettings;
  currentVideo: WatchPartyVideo | null;
  currentTimestamp: number;
  playbackState: "playing" | "paused" | "stopped";
  viewers: Viewer[];
  isPlaying: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WatchPartyVideo {
  id: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  platform: "youtube" | "twitch" | "twitcasting" | "niconico";
  duration: number;
  currentTime: number;
}

export interface RoomSettings {
  name: string;
  description: string;
  maxViewers: number;
  isPrivate: boolean;
  allowChat: boolean;
  autoSync: boolean;
  syncInterval: number;
  moderators: string[];
  bannedUsers: string[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  videos: Video[];
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  platform: "youtube" | "twitch" | "twitcasting" | "niconico";
  duration: number;
  creatorId: string;
  creatorName: string;
  createdAt: Date;
}

export interface Viewer {
  id: string;
  name: string;
  avatar?: string;
  avatarUrl?: string | null;
  role: "viewer" | "moderator" | "host";
  joinedAt: Date;
  lastSeen: Date;
  isMuted: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
  isDeleted: boolean;
}

export interface Analytics {
  totalViewers: number;
  currentViewers: number;
  peakViewers: number;
  averageWatchTime: number;
  chatMessages: number;
  viewerRetention: number;
  platformBreakdown: {
    platform: string;
    count: number;
    percentage: number;
  }[];
  viewerTimeline: {
    timestamp: Date;
    viewers: number;
  }[];
  popularMoments: {
    timestamp: number;
    video: string;
    reactions: number;
  }[];
}

export interface OBSSettings {
  width: number;
  height: number;
  showChat: boolean;
  showViewers: boolean;
  chromaKey: boolean;
  backgroundColor: string;
  chatPosition: "left" | "right" | "bottom";
  chatOpacity: number;
  viewerListPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export interface WatchPartyReaction {
  id: string;
  userId: string;
  userName: string;
  type: "heart" | "laugh" | "wow" | "fire" | "clap";
  timestamp: string;
}

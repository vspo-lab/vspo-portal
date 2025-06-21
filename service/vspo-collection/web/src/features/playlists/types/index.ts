import type { Clip, Playlist } from "../../../common/types/schemas";

export interface PlaylistDetail extends Playlist {
  description: string;
  createdAt: string;
  updatedAt: string;
  totalDuration: string;
  creatorAvatar: string;
  creatorLevel: number;
  isFollowing: boolean;
  videos: PlaylistVideo[];
}

export interface PlaylistVideo extends Clip {
  addedAt: string;
  orderIndex: number;
}

export type PlaylistCategory =
  | "all"
  | "gaming"
  | "music"
  | "collab"
  | "asmr"
  | "art"
  | "talk"
  | "cooking"
  | "special";

export type PlaylistSortOption =
  | "popular"
  | "recent"
  | "mostVideos"
  | "trending"
  | "alphabetical";

export interface PlaylistFilters {
  category: PlaylistCategory;
  sortBy: PlaylistSortOption;
  searchQuery: string;
}

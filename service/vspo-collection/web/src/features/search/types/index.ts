import type { Creator } from "../../../common/types/creator";
import type { Clip, Playlist } from "../../../common/types/schemas";

// Search content types
export type SearchContentType =
  | "all"
  | "vtubers"
  | "clips"
  | "playlists"
  | "watchparties";

// Platform filter
export type SearchPlatform =
  | "all"
  | "youtube"
  | "twitch"
  | "twitcasting"
  | "niconico"
  | "bilibili";

// Date range filter
export type SearchDateRange = "all" | "day" | "week" | "month" | "year";

// Sort options
export type SearchSortBy =
  | "relevance"
  | "recent"
  | "popular"
  | "views"
  | "alphabetical";

// Search filters
export interface SearchFilters {
  contentType: SearchContentType;
  platform: SearchPlatform;
  dateRange: SearchDateRange;
  sortBy: SearchSortBy;
  query: string;
}

// Extended types for search results
export interface SearchableVTuber extends Creator {
  totalClips: number;
  totalViews: string;
  isLive: boolean;
  lastActive: string;
}

export interface SearchableClip extends Clip {
  platform: SearchPlatform;
  uploadedAt: string;
  tags: string[];
  category: string;
  transcript?: string; // For search indexing
}

export interface SearchablePlaylist extends Playlist {
  description: string;
  createdAt: string;
  updatedAt: string;
  totalDuration: string;
  category: string;
  isPublic: boolean;
}

export interface SearchableWatchParty {
  id: number;
  title: string;
  description: string;
  hostUser: string;
  hostAvatar: string;
  thumbnail: string;
  viewers: number;
  maxViewers: number;
  status: "live" | "scheduled" | "ended";
  startTime: string;
  endTime?: string;
  contentType: "clip" | "playlist" | "live";
  contentId: number;
  tags: string[];
  isPublic: boolean;
  roomCode: string;
}

// Search results
export interface SearchResults {
  vtubers: SearchableVTuber[];
  clips: SearchableClip[];
  playlists: SearchablePlaylist[];
  watchParties: SearchableWatchParty[];
  totalResults: number;
  searchTime: number; // in milliseconds
}

// Search suggestions
export interface SearchSuggestion {
  id: string;
  text: string;
  type: "query" | "vtuber" | "tag" | "category";
  popularity: number;
  icon?: string;
}

// Recent searches
export interface RecentSearch {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
}

// Popular searches
export interface PopularSearch {
  id: string;
  query: string;
  searchCount: number;
  trend: "up" | "down" | "stable";
  category?: string;
}

// Search state
export interface SearchState {
  query: string;
  filters: SearchFilters;
  results: SearchResults | null;
  suggestions: SearchSuggestion[];
  recentSearches: RecentSearch[];
  popularSearches: PopularSearch[];
  isLoading: boolean;
  isLoadingSuggestions: boolean;
  error: string | null;
  hasSearched: boolean;
  showAdvancedFilters: boolean;
}

// Search analytics
export interface SearchAnalytics {
  totalSearches: number;
  averageResultsPerSearch: number;
  mostSearchedTerms: PopularSearch[];
  searchTrends: {
    timeframe: "hour" | "day" | "week" | "month";
    data: { period: string; searches: number }[];
  };
}

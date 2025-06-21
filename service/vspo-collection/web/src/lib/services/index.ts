// Base service utilities
export {
  BaseService,
  ServiceError,
  ValidationError,
  NotFoundError,
} from "./base";
export type {
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
  BaseSort,
  BaseDateRange,
} from "./base";

// Creator Service
export { default as CreatorService } from "./creatorService";
export type { CreatorFilters, CreatorSort } from "./creatorService";

// Clip Service
export { default as ClipService } from "./clipService";
export type { ClipFilters, ClipSort, ClipAnalytics } from "./clipService";

// Playlist Service
export { default as PlaylistService } from "./playlistService";
export type {
  PlaylistFilters,
  PlaylistSort,
  PlaylistItem,
  PlaylistDetail,
} from "./playlistService";

// Watch Party Service
export { default as WatchPartyService } from "./watchPartyService";
export type {
  WatchPartyFilters,
  WatchPartySort,
  WatchPartyDetail,
  CreateWatchPartyRequest,
  JoinWatchPartyRequest,
} from "./watchPartyService";

// User Service
export { default as UserService } from "./userService";
export type {
  UserFilters,
  UserSort,
  UpdateUserProfileRequest,
  UserActivityFilters,
  CollectionFilters,
} from "./userService";

// Search Service
export { default as SearchService } from "./searchService";
export type {
  SearchFilters,
  SearchSort,
  SearchResult,
  SearchSuggestions,
  AutoComplete,
} from "./searchService";

// Service collection for easy access
export const Services = {
  Creator: CreatorService,
  Clip: ClipService,
  Playlist: PlaylistService,
  WatchParty: WatchPartyService,
  User: UserService,
  Search: SearchService,
} as const;

// Utility function to create a service layer
export const createServiceLayer = () => Services;

/**
 * Example usage:
 *
 * // Import individual services
 * import { CreatorService, ClipService } from '@/lib/services';
 *
 * // Or import the service collection
 * import { Services } from '@/lib/services';
 * const creators = await Services.Creator.getCreators();
 *
 * // Or create a service layer instance
 * import { createServiceLayer } from '@/lib/services';
 * const services = createServiceLayer();
 * const clips = await services.Clip.getClips();
 */

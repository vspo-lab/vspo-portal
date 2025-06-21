import { z } from "zod";

// User Schemas
export const UserLevelSchema = z.object({
  level: z.number().min(1),
  points: z.number().min(0),
  dailyStreak: z.number().min(0),
});

export const AchievementSchema = z.object({
  icon: z.string(),
  name: z.string(),
  unlocked: z.boolean(),
});

export const ActivitySchema = z.object({
  id: z.string(),
  type: z.enum(["watch", "like", "comment", "playlist", "watchparty"]),
  title: z.string(),
  vtuber: z.string(),
  timestamp: z.string(),
  thumbnail: z.string().optional(),
});

export const CollectionItemSchema = z.object({
  id: z.string(),
  type: z.enum(["clip", "playlist", "vtuber"]),
  title: z.string(),
  thumbnail: z.string(),
  addedAt: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const UserStatsSchema = z.object({
  totalWatchTime: z.number(),
  clipsWatched: z.number(),
  playlistsCreated: z.number(),
  watchPartiesJoined: z.number(),
  favoriteVTuber: z.string(),
  joinedDate: z.string(),
});

export const UserProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar: z.string(),
  level: z.number(),
  points: z.number(),
  dailyStreak: z.number(),
  onlineUsers: z.number(),
  achievements: z.array(AchievementSchema),
  stats: UserStatsSchema,
  recentActivity: z.array(ActivitySchema),
  collection: z.array(CollectionItemSchema),
  badges: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      icon: z.string(),
      description: z.string(),
      rarity: z.enum(["common", "rare", "epic", "legendary"]),
    }),
  ),
});

// VTuber Schemas
export const VTuberSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
});

// Live Watch Party Schemas
export const LiveWatchPartySchema = z.object({
  id: z.number(),
  title: z.string(),
  vtuber: z.string(),
  thumbnail: z.string(),
  viewers: z.number(),
  status: z.enum(["LIVE", "SCHEDULED"]),
  startTime: z.string(),
  hostUser: z.string(),
  hostBadge: z.string(),
  roomCode: z.string(),
  isPopular: z.boolean(),
});

// Playlist Schemas
export const PlaylistSchema = z.object({
  id: z.number(),
  title: z.string(),
  creator: z.string(),
  creatorBadge: z.string(),
  thumbnail: z.string(),
  videoCount: z.number(),
  views: z.string(),
  topVideo: z.string(),
  isHot: z.boolean(),
  likes: z.number(),
  watchPartyCount: z.number(),
  tags: z.array(z.string()),
});

// Clip Schemas
export const ClipSchema = z.object({
  id: z.number(),
  title: z.string(),
  vtuber: z.string(),
  thumbnail: z.string(),
  duration: z.string(),
  views: z.string(),
  clipper: z.string(),
  isExclusive: z.boolean(),
  likes: z.number(),
  comments: z.number(),
  watchPartyActive: z.boolean(),
});

// Recommendation Schemas
export const RecommendationSchema = z.object({
  id: z.number(),
  title: z.string(),
  vtuber: z.string(),
  thumbnail: z.string(),
  duration: z.string(),
  views: z.string(),
  reason: z.string(),
  isPersonalized: z.boolean(),
});

// Special Event Schemas
export const SpecialEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  timeLeft: z.string(),
  isActive: z.boolean(),
});

// Sparkle Effect Schemas
export const SparkleSchema = z.object({
  id: z.number(),
  x: z.number(),
  y: z.number(),
});

// Inferred Types
export type UserLevel = z.infer<typeof UserLevelSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type CollectionItem = z.infer<typeof CollectionItemSchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Badge = z.infer<typeof UserProfileSchema>["badges"][0];
export type VTuber = z.infer<typeof VTuberSchema>;
export type LiveWatchParty = z.infer<typeof LiveWatchPartySchema>;
export type Playlist = z.infer<typeof PlaylistSchema>;
export type Clip = z.infer<typeof ClipSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type SpecialEvent = z.infer<typeof SpecialEventSchema>;
export type Sparkle = z.infer<typeof SparkleSchema>;

import { z } from "zod";
import {
  type Achievement,
  AchievementSchema,
  type Activity,
  ActivitySchema,
  type Badge,
  type CollectionItem,
  CollectionItemSchema,
  type UserProfile,
  UserProfileSchema,
  type UserStats,
  UserStatsSchema,
} from "../../common/types/schemas";
import {
  type ApiResponse,
  BaseService,
  type BaseSort,
  NotFoundError,
  type PaginatedResponse,
  type PaginationParams,
  ValidationError,
  validateId,
  validateNumber,
  validatePagination,
} from "./base";

// User-specific schemas
export const UserFiltersSchema = z.object({
  minLevel: z.number().optional(),
  maxLevel: z.number().optional(),
  minPoints: z.number().optional(),
  hasActiveStreak: z.boolean().optional(),
  favoriteVTuber: z.string().optional(),
  searchQuery: z.string().optional(),
  joinedAfter: z.string().optional(), // ISO date string
  joinedBefore: z.string().optional(), // ISO date string
});

export const UserSortSchema = z.object({
  field: z
    .enum([
      "username",
      "level",
      "points",
      "dailyStreak",
      "totalWatchTime",
      "clipsWatched",
      "playlistsCreated",
      "watchPartiesJoined",
      "joinedDate",
    ])
    .default("level"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export const UpdateUserProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  avatar: z.string().url().optional(),
  favoriteVTuber: z.string().optional(),
});

export const UserActivityFiltersSchema = z.object({
  type: z
    .enum(["watch", "like", "comment", "playlist", "watchparty"])
    .optional(),
  vtuber: z.string().optional(),
  dateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
});

export const CollectionFiltersSchema = z.object({
  type: z.enum(["clip", "playlist", "vtuber"]).optional(),
  searchQuery: z.string().optional(),
  addedAfter: z.string().optional(),
  addedBefore: z.string().optional(),
});

// Inferred types
export type UserFilters = z.infer<typeof UserFiltersSchema>;
export type UserSort = z.infer<typeof UserSortSchema>;
export type UpdateUserProfileRequest = z.infer<typeof UpdateUserProfileSchema>;
export type UserActivityFilters = z.infer<typeof UserActivityFiltersSchema>;
export type CollectionFilters = z.infer<typeof CollectionFiltersSchema>;

// Mock data
const mockUsers: (UserProfile & {
  email: string;
  createdAt: string;
  lastActiveAt: string;
  isOnline: boolean;
})[] = [
  {
    id: "user_1",
    username: "VSPOファン123",
    avatar: "/placeholder.svg?height=64&width=64",
    level: 25,
    points: 12450,
    dailyStreak: 7,
    onlineUsers: 1543,
    email: "user1@example.com",
    createdAt: "2023-06-15T09:00:00Z",
    lastActiveAt: "2024-01-16T18:30:00Z",
    isOnline: true,
    achievements: [
      { icon: "🎮", name: "ゲーマー", unlocked: true },
      { icon: "🎵", name: "音楽愛好家", unlocked: true },
      { icon: "🔥", name: "連続視聴", unlocked: true },
      { icon: "⭐", name: "スター視聴者", unlocked: false },
    ],
    stats: {
      totalWatchTime: 156000, // seconds
      clipsWatched: 1234,
      playlistsCreated: 8,
      watchPartiesJoined: 23,
      favoriteVTuber: "橘ひなの",
      joinedDate: "2023-06-15",
    },
    recentActivity: [
      {
        id: "activity_1",
        type: "watch",
        title: "【APEX】神業クラッチ決定瞬間！",
        vtuber: "橘ひなの",
        timestamp: "2024-01-16T18:30:00Z",
        thumbnail: "/placeholder.svg?height=60&width=120",
      },
      {
        id: "activity_2",
        type: "like",
        title: "【歌枠】シャルルを熱唱",
        vtuber: "藍沢エマ",
        timestamp: "2024-01-16T17:45:00Z",
        thumbnail: "/placeholder.svg?height=60&width=120",
      },
      {
        id: "activity_3",
        type: "playlist",
        title: "お気に入りFPS集",
        vtuber: "作成済み",
        timestamp: "2024-01-16T15:20:00Z",
      },
    ],
    collection: [
      {
        id: "collection_1",
        type: "clip",
        title: "【APEX】橘ひなの 1vs3クラッチ",
        thumbnail: "/placeholder.svg?height=90&width=160",
        addedAt: "2024-01-16T18:30:00Z",
        metadata: { duration: "2:45", vtuber: "橘ひなの" },
      },
      {
        id: "collection_2",
        type: "playlist",
        title: "VSPOメンバー最強ゲーミングモーメント集",
        thumbnail: "/placeholder.svg?height=90&width=160",
        addedAt: "2024-01-15T14:30:00Z",
        metadata: { videoCount: 25, creator: "ゲーム切り抜き師" },
      },
      {
        id: "collection_3",
        type: "vtuber",
        title: "橘ひなの",
        thumbnail: "/placeholder.svg?height=90&width=160",
        addedAt: "2024-01-10T09:00:00Z",
        metadata: { memberType: "vspo_jp" },
      },
    ],
    badges: [
      {
        id: "badge_1",
        name: "初心者",
        icon: "🌱",
        description: "アカウント作成",
        rarity: "common",
      },
      {
        id: "badge_2",
        name: "熱狂的ファン",
        icon: "🔥",
        description: "7日連続ログイン",
        rarity: "rare",
      },
      {
        id: "badge_3",
        name: "レジェンド視聴者",
        icon: "👑",
        description: "100時間視聴達成",
        rarity: "epic",
      },
    ],
  },
  {
    id: "user_2",
    username: "音楽好きリスナー",
    avatar: "/placeholder.svg?height=64&width=64",
    level: 18,
    points: 8920,
    dailyStreak: 3,
    onlineUsers: 1543,
    email: "user2@example.com",
    createdAt: "2023-08-20T14:30:00Z",
    lastActiveAt: "2024-01-16T20:15:00Z",
    isOnline: true,
    achievements: [
      { icon: "🎵", name: "音楽愛好家", unlocked: true },
      { icon: "🎧", name: "ASMR愛好家", unlocked: true },
      { icon: "🎮", name: "ゲーマー", unlocked: false },
      { icon: "⭐", name: "スター視聴者", unlocked: false },
    ],
    stats: {
      totalWatchTime: 89400,
      clipsWatched: 567,
      playlistsCreated: 12,
      watchPartiesJoined: 8,
      favoriteVTuber: "一ノ瀬うるは",
      joinedDate: "2023-08-20",
    },
    recentActivity: [
      {
        id: "activity_4",
        type: "watch",
        title: "【ASMR】癒やしの耳かき音",
        vtuber: "一ノ瀬うるは",
        timestamp: "2024-01-16T20:15:00Z",
        thumbnail: "/placeholder.svg?height=60&width=120",
      },
      {
        id: "activity_5",
        type: "watchparty",
        title: "みんなで歌詞を覚えよう",
        vtuber: "藍沢エマ",
        timestamp: "2024-01-16T19:30:00Z",
      },
    ],
    collection: [
      {
        id: "collection_4",
        type: "playlist",
        title: "癒やしボイスASMR完全版",
        thumbnail: "/placeholder.svg?height=90&width=160",
        addedAt: "2024-01-16T20:00:00Z",
        metadata: { videoCount: 42, creator: "ASMR愛好家" },
      },
    ],
    badges: [
      {
        id: "badge_1",
        name: "初心者",
        icon: "🌱",
        description: "アカウント作成",
        rarity: "common",
      },
      {
        id: "badge_4",
        name: "音楽マスター",
        icon: "🎼",
        description: "音楽系コンテンツを50時間視聴",
        rarity: "rare",
      },
    ],
  },
  {
    id: "user_3",
    username: "新人VTuberファン",
    avatar: "/placeholder.svg?height=64&width=64",
    level: 5,
    points: 1280,
    dailyStreak: 1,
    onlineUsers: 1543,
    email: "user3@example.com",
    createdAt: "2024-01-01T12:00:00Z",
    lastActiveAt: "2024-01-16T16:45:00Z",
    isOnline: false,
    achievements: [
      { icon: "🌱", name: "新人", unlocked: true },
      { icon: "🎮", name: "ゲーマー", unlocked: false },
      { icon: "🎵", name: "音楽愛好家", unlocked: false },
      { icon: "⭐", name: "スター視聴者", unlocked: false },
    ],
    stats: {
      totalWatchTime: 12600,
      clipsWatched: 89,
      playlistsCreated: 2,
      watchPartiesJoined: 1,
      favoriteVTuber: "胡桃のあ",
      joinedDate: "2024-01-01",
    },
    recentActivity: [
      {
        id: "activity_6",
        type: "watch",
        title: "【お絵描き】3時間で推しの絵を完成",
        vtuber: "胡桃のあ",
        timestamp: "2024-01-16T16:45:00Z",
        thumbnail: "/placeholder.svg?height=60&width=120",
      },
    ],
    collection: [
      {
        id: "collection_5",
        type: "vtuber",
        title: "胡桃のあ",
        thumbnail: "/placeholder.svg?height=90&width=160",
        addedAt: "2024-01-05T10:30:00Z",
        metadata: { memberType: "vspo_jp" },
      },
    ],
    badges: [
      {
        id: "badge_1",
        name: "初心者",
        icon: "🌱",
        description: "アカウント作成",
        rarity: "common",
      },
    ],
  },
];

// Current user (simulated logged-in user)
const currentUser = mockUsers[0];

class UserService extends BaseService {
  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    await UserService.simulateNetworkDelay(100, 300);

    try {
      const cacheKey = "current_user";
      const cached = UserService.getCache<UserProfile>(cacheKey);
      if (cached) {
        return UserService.createResponse(cached, true);
      }

      // Simulate getting current user from auth context
      const userProfile = {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        level: currentUser.level,
        points: currentUser.points,
        dailyStreak: currentUser.dailyStreak,
        onlineUsers: currentUser.onlineUsers,
        achievements: currentUser.achievements,
        stats: currentUser.stats,
        recentActivity: currentUser.recentActivity,
        collection: currentUser.collection,
        badges: currentUser.badges,
      };

      UserService.setCache(cacheKey, userProfile, 10); // Cache for 10 minutes
      return UserService.createResponse(userProfile);
    } catch (error) {
      throw new Error(
        `Failed to fetch current user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<ApiResponse<UserProfile>> {
    await UserService.simulateNetworkDelay(150, 400);

    try {
      const validatedId = validateId(id, "User ID");

      const cacheKey = `user_${validatedId}`;
      const cached = UserService.getCache<UserProfile>(cacheKey);
      if (cached) {
        return UserService.createResponse(cached, true);
      }

      const user = mockUsers.find((u) => u.id === validatedId);
      if (!user) {
        throw new NotFoundError("User", validatedId);
      }

      const userProfile = {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        level: user.level,
        points: user.points,
        dailyStreak: user.dailyStreak,
        onlineUsers: user.onlineUsers,
        achievements: user.achievements,
        stats: user.stats,
        recentActivity: user.recentActivity,
        collection: user.collection,
        badges: user.badges,
      };

      UserService.setCache(cacheKey, userProfile, 15);
      return UserService.createResponse(userProfile);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to fetch user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update current user profile
   */
  static async updateUserProfile(
    updates: UpdateUserProfileRequest,
  ): Promise<ApiResponse<UserProfile>> {
    await UserService.simulateNetworkDelay(400, 800);

    try {
      const validatedUpdates = UpdateUserProfileSchema.parse(updates);

      // Simulate updating user profile
      if (validatedUpdates.username) {
        currentUser.username = validatedUpdates.username;
      }
      if (validatedUpdates.avatar) {
        currentUser.avatar = validatedUpdates.avatar;
      }
      if (validatedUpdates.favoriteVTuber) {
        currentUser.stats.favoriteVTuber = validatedUpdates.favoriteVTuber;
      }

      const updatedProfile = {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        level: currentUser.level,
        points: currentUser.points,
        dailyStreak: currentUser.dailyStreak,
        onlineUsers: currentUser.onlineUsers,
        achievements: currentUser.achievements,
        stats: currentUser.stats,
        recentActivity: currentUser.recentActivity,
        collection: currentUser.collection,
        badges: currentUser.badges,
      };

      // Clear cache
      UserService.clearCache("current_user");
      UserService.clearCache(`user_${currentUser.id}`);

      return UserService.createResponse(updatedProfile);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to update user profile: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get user activity history
   */
  static async getUserActivity(
    userId?: string,
    filters?: UserActivityFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<Activity>> {
    await UserService.simulateNetworkDelay(200, 500);

    try {
      const validatedPagination = validatePagination(pagination || {});
      const validatedFilters = UserActivityFiltersSchema.parse(filters || {});

      const targetUserId = userId || currentUser.id;
      const user = mockUsers.find((u) => u.id === targetUserId);
      if (!user) {
        throw new NotFoundError("User", targetUserId);
      }

      let activities = [...user.recentActivity];

      // Apply filters
      if (validatedFilters.type) {
        activities = activities.filter(
          (activity) => activity.type === validatedFilters.type,
        );
      }

      if (validatedFilters.vtuber) {
        activities = activities.filter((activity) =>
          activity.vtuber
            .toLowerCase()
            .includes(validatedFilters.vtuber?.toLowerCase()),
        );
      }

      if (validatedFilters.dateRange?.from || validatedFilters.dateRange?.to) {
        activities = activities.filter((activity) => {
          const activityDate = new Date(activity.timestamp);
          const fromDate = validatedFilters.dateRange?.from
            ? new Date(validatedFilters.dateRange.from)
            : null;
          const toDate = validatedFilters.dateRange?.to
            ? new Date(validatedFilters.dateRange.to)
            : null;

          if (fromDate && activityDate < fromDate) return false;
          if (toDate && activityDate > toDate) return false;
          return true;
        });
      }

      // Sort by timestamp (newest first)
      activities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // Apply pagination
      const { items, total } = UserService.paginateArray(
        activities,
        validatedPagination,
      );
      const paginationMeta = UserService.calculatePagination(
        total,
        validatedPagination.page,
        validatedPagination.limit,
      );

      return UserService.createPaginatedResponse(items, paginationMeta);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to fetch user activity: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get user collection
   */
  static async getUserCollection(
    userId?: string,
    filters?: CollectionFilters,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<CollectionItem>> {
    await UserService.simulateNetworkDelay(200, 500);

    try {
      const validatedPagination = validatePagination(pagination || {});
      const validatedFilters = CollectionFiltersSchema.parse(filters || {});

      const targetUserId = userId || currentUser.id;
      const user = mockUsers.find((u) => u.id === targetUserId);
      if (!user) {
        throw new NotFoundError("User", targetUserId);
      }

      let collection = [...user.collection];

      // Apply filters
      if (validatedFilters.type) {
        collection = collection.filter(
          (item) => item.type === validatedFilters.type,
        );
      }

      if (validatedFilters.searchQuery) {
        collection = UserService.filterBySearch(
          collection,
          validatedFilters.searchQuery,
          ["title"],
        );
      }

      if (validatedFilters.addedAfter || validatedFilters.addedBefore) {
        collection = collection.filter((item) => {
          const addedDate = new Date(item.addedAt);
          const afterDate = validatedFilters.addedAfter
            ? new Date(validatedFilters.addedAfter)
            : null;
          const beforeDate = validatedFilters.addedBefore
            ? new Date(validatedFilters.addedBefore)
            : null;

          if (afterDate && addedDate < afterDate) return false;
          if (beforeDate && addedDate > beforeDate) return false;
          return true;
        });
      }

      // Sort by addedAt (newest first)
      collection.sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
      );

      // Apply pagination
      const { items, total } = UserService.paginateArray(
        collection,
        validatedPagination,
      );
      const paginationMeta = UserService.calculatePagination(
        total,
        validatedPagination.page,
        validatedPagination.limit,
      );

      return UserService.createPaginatedResponse(items, paginationMeta);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to fetch user collection: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Add item to user collection
   */
  static async addToCollection(
    itemData: Omit<CollectionItem, "id" | "addedAt">,
  ): Promise<ApiResponse<CollectionItem>> {
    await UserService.simulateNetworkDelay(300, 600);

    try {
      const validatedItem = CollectionItemSchema.omit({
        id: true,
        addedAt: true,
      }).parse(itemData);

      const newItem: CollectionItem = {
        id: `collection_${Date.now()}`,
        ...validatedItem,
        addedAt: new Date().toISOString(),
      };

      // Simulate adding to collection
      currentUser.collection.unshift(newItem);

      // Clear cache
      UserService.clearCache("current_user");

      return UserService.createResponse(newItem);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to add item to collection: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Remove item from user collection
   */
  static async removeFromCollection(
    itemId: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    await UserService.simulateNetworkDelay(200, 400);

    try {
      const validatedId = validateId(itemId, "Collection item ID");

      const itemIndex = currentUser.collection.findIndex(
        (item) => item.id === validatedId,
      );
      if (itemIndex === -1) {
        throw new NotFoundError("Collection item", validatedId);
      }

      // Simulate removing from collection
      currentUser.collection.splice(itemIndex, 1);

      // Clear cache
      UserService.clearCache("current_user");

      return UserService.createResponse({ success: true });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to remove item from collection: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Award achievement to user
   */
  static async awardAchievement(
    achievementName: string,
  ): Promise<ApiResponse<Achievement>> {
    await UserService.simulateNetworkDelay(300, 600);

    try {
      const achievement = currentUser.achievements.find(
        (a) => a.name === achievementName,
      );
      if (!achievement) {
        throw new NotFoundError("Achievement", achievementName);
      }

      if (achievement.unlocked) {
        throw new ValidationError("Achievement already unlocked");
      }

      // Simulate unlocking achievement
      achievement.unlocked = true;

      // Award points based on achievement rarity
      const pointsAwarded = 100; // Could be dynamic based on achievement
      currentUser.points += pointsAwarded;

      // Clear cache
      UserService.clearCache("current_user");

      return UserService.createResponse(achievement);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to award achievement: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Update daily streak
   */
  static async updateDailyStreak(): Promise<
    ApiResponse<{ dailyStreak: number; pointsAwarded: number }>
  > {
    await UserService.simulateNetworkDelay(200, 400);

    try {
      // Simulate daily login
      currentUser.dailyStreak += 1;

      // Award streak bonus points
      const pointsAwarded = currentUser.dailyStreak * 10;
      currentUser.points += pointsAwarded;

      // Check for streak achievements
      if (currentUser.dailyStreak === 7) {
        const streakAchievement = currentUser.achievements.find(
          (a) => a.name === "連続視聴",
        );
        if (streakAchievement && !streakAchievement.unlocked) {
          streakAchievement.unlocked = true;
        }
      }

      // Clear cache
      UserService.clearCache("current_user");

      return UserService.createResponse({
        dailyStreak: currentUser.dailyStreak,
        pointsAwarded,
      });
    } catch (error) {
      throw new Error(
        `Failed to update daily streak: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get user leaderboard
   */
  static async getUserLeaderboard(
    sort?: UserSort,
    pagination?: PaginationParams,
  ): Promise<
    PaginatedResponse<
      Pick<
        UserProfile,
        "id" | "username" | "avatar" | "level" | "points" | "stats"
      >
    >
  > {
    await UserService.simulateNetworkDelay(300, 700);

    try {
      const validatedPagination = validatePagination(pagination || {});
      const validatedSort = UserSortSchema.parse(sort || {});

      const cacheKey = `leaderboard_${JSON.stringify({ sort: validatedSort, pagination: validatedPagination })}`;
      const cached = UserService.getCache(cacheKey);
      if (cached) {
        return { ...cached, meta: { ...cached.meta, cached: true } };
      }

      let users = mockUsers.map((user) => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        level: user.level,
        points: user.points,
        stats: user.stats,
      }));

      // Apply sorting
      users = UserService.sortArray(users, {
        field: validatedSort.field,
        direction: validatedSort.direction,
      });

      // Apply pagination
      const { items, total } = UserService.paginateArray(
        users,
        validatedPagination,
      );
      const paginationMeta = UserService.calculatePagination(
        total,
        validatedPagination.page,
        validatedPagination.limit,
      );

      const response = UserService.createPaginatedResponse(
        items,
        paginationMeta,
      );
      UserService.setCache(cacheKey, response, 30); // Cache for 30 minutes

      return response;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(
        `Failed to fetch user leaderboard: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get user statistics
   */
  static async getUserAnalytics(): Promise<
    ApiResponse<{
      totalUsers: number;
      activeUsers: number;
      averageLevel: number;
      totalWatchTime: number;
      totalClipsWatched: number;
      totalPlaylistsCreated: number;
      levelDistribution: Record<string, number>;
      favoriteVTuberStats: Record<string, number>;
      achievementStats: Record<string, number>;
    }>
  > {
    await UserService.simulateNetworkDelay(250, 600);

    try {
      const cacheKey = "user_analytics";
      const cached = UserService.getCache(cacheKey);
      if (cached) {
        return UserService.createResponse(cached, true);
      }

      const totalUsers = mockUsers.length;
      const activeUsers = mockUsers.filter((u) => u.isOnline).length;
      const averageLevel =
        mockUsers.reduce((sum, u) => sum + u.level, 0) / totalUsers;
      const totalWatchTime = mockUsers.reduce(
        (sum, u) => sum + u.stats.totalWatchTime,
        0,
      );
      const totalClipsWatched = mockUsers.reduce(
        (sum, u) => sum + u.stats.clipsWatched,
        0,
      );
      const totalPlaylistsCreated = mockUsers.reduce(
        (sum, u) => sum + u.stats.playlistsCreated,
        0,
      );

      // Level distribution
      const levelDistribution: Record<string, number> = {
        "1-10": 0,
        "11-20": 0,
        "21-30": 0,
        "31+": 0,
      };

      mockUsers.forEach((user) => {
        if (user.level <= 10) levelDistribution["1-10"]++;
        else if (user.level <= 20) levelDistribution["11-20"]++;
        else if (user.level <= 30) levelDistribution["21-30"]++;
        else levelDistribution["31+"]++;
      });

      // Favorite VTuber stats
      const favoriteVTuberStats: Record<string, number> = {};
      mockUsers.forEach((user) => {
        const fav = user.stats.favoriteVTuber;
        favoriteVTuberStats[fav] = (favoriteVTuberStats[fav] || 0) + 1;
      });

      // Achievement stats
      const achievementStats: Record<string, number> = {};
      mockUsers.forEach((user) => {
        user.achievements.forEach((achievement) => {
          if (achievement.unlocked) {
            achievementStats[achievement.name] =
              (achievementStats[achievement.name] || 0) + 1;
          }
        });
      });

      const analytics = {
        totalUsers,
        activeUsers,
        averageLevel: Math.round(averageLevel * 10) / 10,
        totalWatchTime,
        totalClipsWatched,
        totalPlaylistsCreated,
        levelDistribution,
        favoriteVTuberStats,
        achievementStats,
      };

      UserService.setCache(cacheKey, analytics, 60); // Cache for 1 hour
      return UserService.createResponse(analytics);
    } catch (error) {
      throw new Error(
        `Failed to fetch user analytics: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export default UserService;

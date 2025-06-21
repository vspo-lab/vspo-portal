import { useCallback, useState } from "react";
import type {
  Achievement,
  Activity,
  Badge,
  CollectionItem,
  UserProfile,
} from "../../../common/types/schemas";

const mockAchievements: Achievement[] = [
  { icon: "🏆", name: "初回ログイン", unlocked: true },
  { icon: "💎", name: "プレミアム会員", unlocked: true },
  { icon: "🔥", name: "連続ログイン10日", unlocked: true },
  { icon: "⭐", name: "お気に入り100個", unlocked: false },
  { icon: "🎮", name: "ウォッチパーティー主催者", unlocked: true },
  { icon: "📺", name: "視聴時間100時間", unlocked: true },
  { icon: "💬", name: "コメント名人", unlocked: false },
  { icon: "🎯", name: "全メンバーフォロー", unlocked: false },
];

const mockBadges: Badge[] = [
  {
    id: "badge-1",
    name: "古参ファン",
    icon: "👑",
    description: "サービス開始から1ヶ月以内に登録",
    rarity: "legendary",
  },
  {
    id: "badge-2",
    name: "ぶいすぽ応援団",
    icon: "📣",
    description: "50以上のクリップに「いいね」",
    rarity: "rare",
  },
  {
    id: "badge-3",
    name: "プレイリスト職人",
    icon: "🎵",
    description: "10個以上のプレイリストを作成",
    rarity: "epic",
  },
  {
    id: "badge-4",
    name: "ナイトウォッチャー",
    icon: "🌙",
    description: "深夜配信を50回以上視聴",
    rarity: "common",
  },
];

const mockRecentActivity: Activity[] = [
  {
    id: "activity-1",
    type: "watch",
    title: "【APEX】ランクマッチ！マスター目指す配信",
    vtuber: "胡桃のあ",
    timestamp: "2時間前",
    thumbnail: "https://picsum.photos/seed/activity1/320/180",
  },
  {
    id: "activity-2",
    type: "like",
    title: "神プレイ集 - 一ノ瀬うるは Best Moments",
    vtuber: "一ノ瀬うるは",
    timestamp: "3時間前",
    thumbnail: "https://picsum.photos/seed/activity2/320/180",
  },
  {
    id: "activity-3",
    type: "playlist",
    title: "ぶいすぽっ！歌ってみた集",
    vtuber: "Various",
    timestamp: "5時間前",
  },
  {
    id: "activity-4",
    type: "watchparty",
    title: "みんなで見よう！ぶいすぽ大会",
    vtuber: "ぶいすぽっ！",
    timestamp: "1日前",
    thumbnail: "https://picsum.photos/seed/activity4/320/180",
  },
  {
    id: "activity-5",
    type: "comment",
    title: "【雑談】今日あったことを話す",
    vtuber: "花芽すみれ",
    timestamp: "2日前",
    thumbnail: "https://picsum.photos/seed/activity5/320/180",
  },
];

const mockCollection: CollectionItem[] = [
  {
    id: "collection-1",
    type: "clip",
    title: "【神回】エモすぎる告白シーン",
    thumbnail: "https://picsum.photos/seed/collection1/320/180",
    addedAt: "2024-01-15",
    metadata: {
      duration: "5:23",
      views: "120K",
    },
  },
  {
    id: "collection-2",
    type: "playlist",
    title: "VSPO！メンバー歌ってみた集",
    thumbnail: "https://picsum.photos/seed/collection2/320/180",
    addedAt: "2024-01-10",
    metadata: {
      videoCount: 45,
      totalDuration: "3:45:00",
    },
  },
  {
    id: "collection-3",
    type: "vtuber",
    title: "小雀とと",
    thumbnail: "https://picsum.photos/seed/collection3/320/180",
    addedAt: "2024-01-08",
    metadata: {
      subscriberCount: "250K",
      latestStream: "VALORANT練習",
    },
  },
  {
    id: "collection-4",
    type: "clip",
    title: "爆笑！罰ゲーム集",
    thumbnail: "https://picsum.photos/seed/collection4/320/180",
    addedAt: "2024-01-05",
    metadata: {
      duration: "10:15",
      views: "85K",
    },
  },
];

const initialUserProfile: UserProfile = {
  id: "user-123",
  username: "VSPOファン太郎",
  avatar: "😊",
  level: 7,
  points: 2847,
  dailyStreak: 12,
  onlineUsers: 1247,
  achievements: mockAchievements,
  stats: {
    totalWatchTime: 156.5,
    clipsWatched: 342,
    playlistsCreated: 8,
    watchPartiesJoined: 23,
    favoriteVTuber: "胡桃のあ",
    joinedDate: "2023-12-01",
  },
  recentActivity: mockRecentActivity,
  collection: mockCollection,
  badges: mockBadges,
};

export const useUserProfile = () => {
  const [userProfile, setUserProfile] =
    useState<UserProfile>(initialUserProfile);
  const [isLoading] = useState(false);

  const addPoints = useCallback((points: number) => {
    setUserProfile((prev) => ({
      ...prev,
      points: prev.points + points,
    }));
  }, []);

  const updateLevel = useCallback((level: number) => {
    setUserProfile((prev) => ({
      ...prev,
      level,
    }));
  }, []);

  const updateDailyStreak = useCallback((streak: number) => {
    setUserProfile((prev) => ({
      ...prev,
      dailyStreak: streak,
    }));
  }, []);

  const toggleAchievement = useCallback((achievementName: string) => {
    setUserProfile((prev) => ({
      ...prev,
      achievements: prev.achievements.map((achievement) =>
        achievement.name === achievementName
          ? { ...achievement, unlocked: !achievement.unlocked }
          : achievement,
      ),
    }));
  }, []);

  const addToCollection = useCallback((item: CollectionItem) => {
    setUserProfile((prev) => ({
      ...prev,
      collection: [item, ...prev.collection],
    }));
  }, []);

  const removeFromCollection = useCallback((itemId: string) => {
    setUserProfile((prev) => ({
      ...prev,
      collection: prev.collection.filter((item) => item.id !== itemId),
    }));
  }, []);

  const addActivity = useCallback((activity: Activity) => {
    setUserProfile((prev) => ({
      ...prev,
      recentActivity: [activity, ...prev.recentActivity].slice(0, 10),
    }));
  }, []);

  return {
    userProfile,
    isLoading,
    addPoints,
    updateLevel,
    updateDailyStreak,
    toggleAchievement,
    addToCollection,
    removeFromCollection,
    addActivity,
  };
};

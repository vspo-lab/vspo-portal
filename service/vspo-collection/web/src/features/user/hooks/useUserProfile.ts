import { useState } from "react";
import type { Achievement, UserProfile } from "../../../common/types/schemas";

const initialAchievements: Achievement[] = [
  { icon: "🏆", name: "初回ログイン", unlocked: true },
  { icon: "💎", name: "プレミアム会員", unlocked: true },
  { icon: "🔥", name: "連続ログイン10日", unlocked: true },
  { icon: "⭐", name: "お気に入り100個", unlocked: false },
];

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    level: 7,
    points: 2847,
    dailyStreak: 12,
    onlineUsers: 1247,
    achievements: initialAchievements,
  });

  const addPoints = (points: number) => {
    setUserProfile((prev) => ({
      ...prev,
      points: prev.points + points,
    }));
  };

  const updateLevel = (level: number) => {
    setUserProfile((prev) => ({
      ...prev,
      level,
    }));
  };

  const updateDailyStreak = (streak: number) => {
    setUserProfile((prev) => ({
      ...prev,
      dailyStreak: streak,
    }));
  };

  return {
    userProfile,
    addPoints,
    updateLevel,
    updateDailyStreak,
  };
};

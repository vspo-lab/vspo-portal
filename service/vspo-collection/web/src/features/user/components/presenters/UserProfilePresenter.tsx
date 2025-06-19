import type { UserProfile } from "../../../../common/types/schemas";

interface UserProfilePresenterProps {
  userProfile: UserProfile;
  onlineUsers: number;
  className?: string;
}

export const UserProfilePresenter = ({
  userProfile,
  onlineUsers,
  className = "",
}: UserProfilePresenterProps) => {
  return (
    <div
      className={`bg-gradient-to-br from-[#8f81fc] to-[#ff6ea2] p-4 text-center ${className}`}
    >
      <div className="bg-white/20 rounded-full w-16 h-16 mx-auto mb-2 flex items-center justify-center text-2xl border-2 border-white/50">
        😊
      </div>
      <h1
        className="text-white text-xl font-bold mb-1 drop-shadow-lg"
        style={{
          fontFamily: "cursive",
          textShadow: "2px 2px 0px rgba(0,0,0,0.2)",
        }}
      >
        ぶいすぽっ推しコレ！
      </h1>
      <p className="text-white/90 text-xs font-medium mb-2">
        〜 ぶいすぽっ！の推しを見つけよう 〜
      </p>

      {/* User Stats */}
      <div className="bg-white/20 rounded-xl p-2 mb-2 backdrop-blur-sm">
        <div className="flex justify-between text-xs text-white/90 mb-1">
          <span>レベル {userProfile.level}</span>
          <span>{userProfile.points}pt</span>
        </div>
        <div className="bg-white/30 rounded-full h-2 mb-1">
          <div
            className="bg-yellow-300 rounded-full h-2"
            style={{ width: "70%" }}
          />
        </div>
        <div className="text-xs text-white/80">
          連続ログイン {userProfile.dailyStreak}日
        </div>
      </div>

      {/* Online Status */}
      <div className="bg-green-500/20 rounded-lg p-2 mb-2">
        <div className="flex items-center justify-center gap-1 text-xs text-white">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>オンライン {onlineUsers}人</span>
        </div>
      </div>

      {/* Achievements */}
      <div className="flex justify-center gap-1">
        {userProfile.achievements.slice(0, 3).map((achievement) => (
          <div
            key={achievement.name}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
              achievement.unlocked
                ? "bg-yellow-300 border-yellow-400 text-yellow-800"
                : "bg-white/20 border-white/30 text-white/50"
            }`}
            title={achievement.name}
          >
            {achievement.icon}
          </div>
        ))}
      </div>
    </div>
  );
};

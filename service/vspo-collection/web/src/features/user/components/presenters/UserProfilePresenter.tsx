import type {
  Activity,
  Badge,
  UserProfile,
} from "../../../../common/types/schemas";

interface UserProfilePresenterProps {
  userProfile: UserProfile;
  onlineUsers: number;
  className?: string;
}

const ActivityIcon: React.FC<{ type: Activity["type"] }> = ({ type }) => {
  const icons = {
    watch: "👁️",
    like: "❤️",
    comment: "💬",
    playlist: "🎵",
    watchparty: "🎉",
  };
  return <span>{icons[type]}</span>;
};

const RarityBadge: React.FC<{ rarity: Badge["rarity"] }> = ({ rarity }) => {
  const colors = {
    common: "bg-gray-200 border-gray-300",
    rare: "bg-blue-200 border-blue-300",
    epic: "bg-purple-200 border-purple-300",
    legendary: "bg-yellow-200 border-yellow-300",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border ${colors[rarity]}`}
    >
      {rarity === "common" && "コモン"}
      {rarity === "rare" && "レア"}
      {rarity === "epic" && "エピック"}
      {rarity === "legendary" && "レジェンド"}
    </span>
  );
};

export const UserProfilePresenter = ({
  userProfile,
  onlineUsers,
  className = "",
}: UserProfilePresenterProps) => {
  const levelProgress = ((userProfile.points % 1000) / 1000) * 100;

  return (
    <div
      className={`bg-gradient-to-br from-[#8f81fc] to-[#ff6ea2] min-h-screen ${className}`}
    >
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header Section */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="bg-white/30 rounded-full w-24 h-24 flex items-center justify-center text-5xl border-4 border-white/50 shadow-lg">
              {userProfile.avatar}
            </div>
            <div className="flex-1">
              <h1 className="text-white text-3xl font-bold mb-2 drop-shadow-lg">
                {userProfile.username}
              </h1>
              <div className="flex items-center gap-4 text-white/90">
                <span className="text-sm">ID: {userProfile.id}</span>
                <span className="text-sm">
                  登録日: {userProfile.stats.joinedDate}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="bg-green-500/30 rounded-lg px-3 py-1 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white text-sm">
                    オンライン {onlineUsers}人
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Level and Points */}
          <div className="mt-6">
            <div className="flex justify-between text-white mb-2">
              <span className="font-bold">レベル {userProfile.level}</span>
              <span>
                {userProfile.points} /{" "}
                {Math.ceil(userProfile.points / 1000) * 1000} pt
              </span>
            </div>
            <div className="bg-white/30 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-300 to-yellow-400 h-full transition-all duration-300"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <div className="mt-2 text-white/90 text-sm">
              連続ログイン {userProfile.dailyStreak}日 🔥
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-white text-xl font-bold mb-4">クイックアクション</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/watch-party/host"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg p-4 text-center transition-all duration-300 hover:shadow-lg transform hover:scale-105"
            >
              <div className="text-2xl mb-2">🎬</div>
              <div className="font-semibold">ウォッチパーティーを開催</div>
            </a>
            <a
              href="/playlists"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg p-4 text-center transition-all duration-300 hover:shadow-lg transform hover:scale-105"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-semibold">プレイリストを作成</div>
            </a>
            <a
              href="/search"
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-lg p-4 text-center transition-all duration-300 hover:shadow-lg transform hover:scale-105"
            >
              <div className="text-2xl mb-2">🔍</div>
              <div className="font-semibold">コンテンツを検索</div>
            </a>
            <a
              href="/vtubers"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg p-4 text-center transition-all duration-300 hover:shadow-lg transform hover:scale-105"
            >
              <div className="text-2xl mb-2">⭐</div>
              <div className="font-semibold">VTuberを探す</div>
            </a>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-white text-xl font-bold mb-4">統計情報</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {userProfile.stats.totalWatchTime}h
              </div>
              <div className="text-white/80 text-sm">総視聴時間</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {userProfile.stats.clipsWatched}
              </div>
              <div className="text-white/80 text-sm">視聴クリップ数</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {userProfile.stats.playlistsCreated}
              </div>
              <div className="text-white/80 text-sm">作成プレイリスト</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {userProfile.stats.watchPartiesJoined}
              </div>
              <div className="text-white/80 text-sm">
                参加ウォッチパーティー
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center col-span-2">
              <div className="text-2xl font-bold text-white">
                {userProfile.stats.favoriteVTuber}
              </div>
              <div className="text-white/80 text-sm">推しVTuber</div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-white text-xl font-bold mb-4">
            バッジコレクション
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userProfile.badges.map((badge) => (
              <div
                key={badge.id}
                className="bg-white/10 rounded-lg p-4 flex items-center gap-3"
              >
                <div className="text-3xl">{badge.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{badge.name}</h3>
                    <RarityBadge rarity={badge.rarity} />
                  </div>
                  <p className="text-white/70 text-sm">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-white text-xl font-bold mb-4">実績</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {userProfile.achievements.map((achievement) => (
              <div
                key={achievement.name}
                className={`relative group cursor-pointer transition-transform hover:scale-110 ${
                  !achievement.unlocked && "opacity-50"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 ${
                    achievement.unlocked
                      ? "bg-yellow-300 border-yellow-400"
                      : "bg-gray-300 border-gray-400"
                  }`}
                >
                  {achievement.icon}
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {achievement.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-white text-xl font-bold mb-4">
            最近のアクティビティ
          </h2>
          <div className="space-y-3">
            {userProfile.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="bg-white/10 rounded-lg p-3 flex items-center gap-3"
              >
                <div className="text-2xl">
                  <ActivityIcon type={activity.type} />
                </div>
                {activity.thumbnail && (
                  <img
                    src={activity.thumbnail}
                    alt={activity.title}
                    className="w-16 h-9 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-white font-medium text-sm">
                    {activity.title}
                  </h3>
                  <div className="text-white/70 text-xs flex items-center gap-2">
                    <span>{activity.vtuber}</span>
                    <span>•</span>
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Section */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6">
          <h2 className="text-white text-xl font-bold mb-4">コレクション</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userProfile.collection.map((item) => (
              <div
                key={item.id}
                className="bg-white/10 rounded-lg overflow-hidden hover:bg-white/20 transition-colors"
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-24 object-cover"
                />
                <div className="p-3">
                  <div className="text-xs text-white/70 mb-1">
                    {item.type === "clip" && "クリップ"}
                    {item.type === "playlist" && "プレイリスト"}
                    {item.type === "vtuber" && "VTuber"}
                  </div>
                  <h3 className="text-white font-medium text-sm line-clamp-2">
                    {item.title}
                  </h3>
                  {item.metadata && (
                    <div className="text-white/60 text-xs mt-1">
                      {item.type === "clip" &&
                        `${item.metadata.duration} • ${item.metadata.views}回視聴`}
                      {item.type === "playlist" &&
                        `${item.metadata.videoCount}本の動画`}
                      {item.type === "vtuber" && item.metadata.subscriberCount}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

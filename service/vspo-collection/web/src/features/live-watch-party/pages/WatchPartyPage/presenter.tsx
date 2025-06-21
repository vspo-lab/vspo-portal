import type {
  LiveWatchParty,
  Sparkle,
  UserProfile,
} from "../../../../common/types/schemas";
import type { useNavigation } from "../../../navigation/hooks/useNavigation";

interface ChatMessage {
  id: number;
  username: string;
  message: string;
  timestamp: string;
  userBadge?: string;
  isHost?: boolean;
  isModerator?: boolean;
}

interface Participant {
  id: number;
  username: string;
  avatar: string;
  badge?: string;
  isHost?: boolean;
  isModerator?: boolean;
}

interface Reaction {
  id: string;
  emoji: string;
  count: number;
  isActive: boolean;
}

interface WatchPartyPagePresenterProps {
  // Watch party data
  watchParty: LiveWatchParty;
  participants: Participant[];
  chatMessages: ChatMessage[];
  reactions: Reaction[];

  // State
  chatMessage: string;
  setChatMessage: (message: string) => void;
  isTheaterMode: boolean;
  isChatVisible: boolean;
  userProfile: UserProfile;
  onlineUsers: number;
  sparkles: Sparkle[];

  // Navigation
  navigation: ReturnType<typeof useNavigation>;

  // Event handlers
  onSendMessage: () => void;
  onReaction: (reactionId: string) => void;
  onToggleTheaterMode: () => void;
  onToggleChat: () => void;
  onLeaveParty: () => void;
  onShare: () => void;
  onReport: () => void;
}

export const WatchPartyPagePresenter = (
  props: WatchPartyPagePresenterProps,
) => {
  const {
    watchParty,
    participants,
    chatMessages,
    reactions,
    chatMessage,
    setChatMessage,
    isTheaterMode,
    isChatVisible,
    userProfile,
    sparkles,
    navigation,
    onSendMessage,
    onReaction,
    onToggleTheaterMode,
    onToggleChat,
    onLeaveParty,
    onShare,
    onReport,
  } = props;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigation.goToHome()}
                className="text-gray-600 hover:text-gray-900"
              >
                ← 戻る
              </button>
              <div>
                <h1 className="text-lg font-bold">{watchParty.title}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      watchParty.status === "LIVE"
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {watchParty.status === "LIVE" ? "● LIVE" : "予定"}
                  </span>
                  <span>{watchParty.vtuber}</span>
                  <span>・</span>
                  <span>{watchParty.viewers.toLocaleString()} 人視聴中</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onShare}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                シェア
              </button>
              <button
                onClick={onLeaveParty}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div
        className={`flex ${isTheaterMode ? "flex-col" : "flex-row"} gap-4 p-4 max-w-7xl mx-auto`}
      >
        {/* Video Player Area */}
        <div className={`${isTheaterMode ? "w-full" : "flex-1"}`}>
          <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
            <div className="aspect-video flex items-center justify-center bg-gray-900">
              <div className="text-white text-center">
                <div className="text-6xl mb-4">🎥</div>
                <p className="text-xl font-bold mb-2">{watchParty.title}</p>
                <p className="text-gray-400">配信プレイヤーエリア</p>
              </div>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <button className="hover:scale-110 transition-transform">
                    ▶️
                  </button>
                  <div className="text-sm">
                    <span>00:00</span>
                    <span className="mx-2">/</span>
                    <span>00:00</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onToggleTheaterMode}
                    className="p-2 hover:bg-white/20 rounded transition-colors"
                  >
                    {isTheaterMode ? "📺" : "🎬"}
                  </button>
                  <button
                    onClick={onToggleChat}
                    className="p-2 hover:bg-white/20 rounded transition-colors"
                  >
                    💬
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reactions */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {reactions.map((reaction) => (
              <button
                key={reaction.id}
                onClick={() => onReaction(reaction.id)}
                className={`px-4 py-2 rounded-full flex items-center gap-2 transition-all ${
                  reaction.isActive
                    ? "bg-pink-100 text-pink-600 scale-110"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                <span className="text-2xl">{reaction.emoji}</span>
                <span className="text-sm font-medium">
                  {reaction.count.toLocaleString()}
                </span>
              </button>
            ))}
          </div>

          {/* Watch Party Info */}
          <div className="mt-4 bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">ウォッチパーティー情報</h3>
              <span className="text-sm text-gray-500">
                ルームコード: {watchParty.roomCode}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">ホスト:</span>
                <span className="flex items-center gap-1">
                  <span>{watchParty.hostBadge}</span>
                  <span>{watchParty.hostUser}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">開始時刻:</span>
                <span>{watchParty.startTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat & Participants */}
        {isChatVisible && (
          <div
            className={`${isTheaterMode ? "w-full mt-4" : "w-80"} flex flex-col gap-4`}
          >
            {/* Participants */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-3">
                参加者 ({participants.length}人)
              </h3>
              <div className="flex flex-wrap gap-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    <img
                      src={participant.avatar}
                      alt={participant.username}
                      className="w-5 h-5 rounded-full"
                    />
                    {participant.badge && <span>{participant.badge}</span>}
                    <span
                      className={`${
                        participant.isHost
                          ? "text-purple-600 font-bold"
                          : participant.isModerator
                            ? "text-blue-600 font-medium"
                            : ""
                      }`}
                    >
                      {participant.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="bg-white rounded-lg shadow flex-1 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">チャット</h3>
                  <button
                    onClick={onReport}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    通報
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-96">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs">
                        {msg.timestamp}
                      </span>
                      {msg.userBadge && <span>{msg.userBadge}</span>}
                      <span
                        className={`font-medium ${
                          msg.isHost
                            ? "text-purple-600"
                            : msg.isModerator
                              ? "text-blue-600"
                              : "text-gray-700"
                        }`}
                      >
                        {msg.username}
                        {msg.isHost && " (ホスト)"}
                        {msg.isModerator && " (MOD)"}
                      </span>
                    </div>
                    <p className="text-gray-800 pl-12">{msg.message}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
                    placeholder="メッセージを入力..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <button
                    onClick={onSendMessage}
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                  >
                    送信
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sparkle Effects */}
      {sparkles.map((sparkle, index) => (
        <div
          key={index}
          className="fixed pointer-events-none animate-sparkle"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
          }}
        >
          ✨
        </div>
      ))}

      {/* User Level Badge */}
      <div className="fixed bottom-4 left-4 bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
        <span className="text-sm font-medium">Lv.{userProfile.level}</span>
        <span className="text-xs text-gray-600">{userProfile.points}pts</span>
      </div>
    </div>
  );
};

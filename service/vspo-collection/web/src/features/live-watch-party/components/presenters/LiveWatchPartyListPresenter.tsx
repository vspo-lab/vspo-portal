import { Play, Radio, Tv, Users } from "lucide-react";
import type { LiveWatchParty } from "../../../../common/types/schemas";

interface LiveWatchPartyListPresenterProps {
  liveWatchParties: LiveWatchParty[];
  onJoinWatchParty: (room: LiveWatchParty) => void;
  onCreateWatchParty: () => void;
  isDesktop?: boolean;
  maxItems?: number;
}

export const LiveWatchPartyListPresenter = ({
  liveWatchParties,
  onJoinWatchParty,
  onCreateWatchParty,
  isDesktop = false,
  maxItems,
}: LiveWatchPartyListPresenterProps) => {
  const displayParties = maxItems
    ? liveWatchParties.slice(0, maxItems)
    : liveWatchParties;

  if (!isDesktop) {
    return (
      <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-2xl p-3 border-2 border-red-500/20 relative">
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
          LIVE
        </div>
        <h3 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-2">
          <Radio className="w-4 h-4 animate-pulse" />
          ライブ同時視聴
        </h3>
        <div className="space-y-2">
          {displayParties.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => onJoinWatchParty(room)}
              className="flex items-center gap-2 p-2 bg-white/80 rounded-lg cursor-pointer hover:bg-white/90 transition-all duration-300 w-full text-left"
            >
              <div className="relative">
                <img
                  src={room.thumbnail || "/placeholder.svg"}
                  alt={room.title}
                  className="w-12 h-8 object-cover rounded"
                />
                <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center">
                  <div className="bg-red-500 rounded-full p-1">
                    <Play className="w-2 h-2 text-white" fill="white" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-gray-800 line-clamp-1">
                  {room.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {room.viewers}
                  </span>
                  <span
                    className={`px-1 py-0.5 rounded text-xs font-bold ${
                      room.status === "LIVE"
                        ? "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {room.status}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-2xl p-4 border-2 border-red-500/20 relative">
      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse flex items-center gap-1">
        <Radio className="w-3 h-3" />
        LIVE
      </div>
      <h2
        className="text-lg lg:text-xl font-bold text-red-600 mb-3 flex items-center gap-2"
        style={{ fontFamily: "cursive" }}
      >
        📺 ライブ同時視聴ルーム
      </h2>
      <div className="space-y-3">
        {displayParties.map((room) => (
          <button
            key={room.id}
            type="button"
            onClick={() => onJoinWatchParty(room)}
            className="border border-red-500/20 rounded-xl p-3 bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-all duration-300 cursor-pointer hover:shadow-md hover:shadow-red-500/10 relative w-full text-left"
          >
            {room.isPopular && (
              <div className="absolute -top-1 -left-1 bg-yellow-400 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full font-bold animate-bounce">
                人気
              </div>
            )}
            <div className="flex gap-3">
              <div className="relative flex-shrink-0">
                <img
                  src={room.thumbnail || "/placeholder.svg"}
                  alt={room.title}
                  className="w-20 h-12 object-cover rounded-lg border border-white/50"
                />
                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                  <div className="bg-red-500 rounded-full p-1.5 shadow-lg">
                    <Play className="w-3 h-3 text-white" fill="white" />
                  </div>
                </div>
                <div
                  className={`absolute -top-1 -right-1 text-white text-xs px-1.5 py-0.5 rounded-full border border-white font-bold ${
                    room.status === "LIVE"
                      ? "bg-red-500 animate-pulse"
                      : "bg-gray-500"
                  }`}
                >
                  {room.status}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 mb-1 text-sm line-clamp-1">
                  {room.title}
                </h3>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-xs text-red-600 font-medium">
                    ホスト: {room.hostUser}
                  </p>
                  <span className="text-xs">{room.hostBadge}</span>
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  開始時間: {room.startTime}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1 bg-red-100 px-1.5 py-0.5 rounded-full text-red-600">
                    <Users className="w-3 h-3" />
                    {room.viewers}人参加中
                  </span>
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded-full font-mono">
                    {room.roomCode}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onCreateWatchParty}
        className="w-full mt-3 bg-gradient-to-r from-red-500 to-pink-500 text-white p-2 rounded-lg font-bold text-sm hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
      >
        <Tv className="w-4 h-4" />
        新しいルームを作成
      </button>
    </div>
  );
};

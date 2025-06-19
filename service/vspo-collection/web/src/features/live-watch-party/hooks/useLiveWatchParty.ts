import { useState } from "react";
import type { LiveWatchParty } from "../../../common/types/schemas";

const initialLiveWatchParties: LiveWatchParty[] = [
  {
    id: 1,
    title: "【みおちゃん】新曲初披露配信",
    vtuber: "🦄 みおちゃん",
    thumbnail: "/placeholder.svg?height=80&width=120",
    viewers: 234,
    status: "LIVE",
    startTime: "20:00",
    hostUser: "ファン太郎",
    hostBadge: "💎",
    roomCode: "MIOCHAN2024",
    isPopular: true,
  },
  {
    id: 2,
    title: "【ひまりちゃん】ホラゲ実況みんなで見よう",
    vtuber: "🌺 ひまりちゃん",
    thumbnail: "/placeholder.svg?height=80&width=120",
    viewers: 156,
    status: "LIVE",
    startTime: "21:30",
    hostUser: "ホラー好き",
    hostBadge: "👻",
    roomCode: "HORROR123",
    isPopular: false,
  },
  {
    id: 3,
    title: "【さくらちゃん】ASMR配信で癒やされよう",
    vtuber: "🌸 さくらちゃん",
    thumbnail: "/placeholder.svg?height=80&width=120",
    viewers: 89,
    status: "SCHEDULED",
    startTime: "22:00",
    hostUser: "癒やし系",
    hostBadge: "🌸",
    roomCode: "ASMR789",
    isPopular: false,
  },
];

export const useLiveWatchParty = () => {
  const [liveWatchParties] = useState<LiveWatchParty[]>(
    initialLiveWatchParties,
  );

  const handleJoinWatchParty = (
    room: LiveWatchParty,
    onPointsAdd: (points: number) => void,
  ) => {
    onPointsAdd(20);
    alert(
      `🎬 同時視聴ルームに参加します！\n\n${room.title}\n\nホスト: ${room.hostUser} ${room.hostBadge}\n参加者: ${room.viewers}人\nルームコード: ${room.roomCode}\n\n+20ポイント獲得！\n\nチャット機能でみんなと盛り上がろう！`,
    );
  };

  const handleCreateWatchParty = () => {
    alert(
      "🎬 同時視聴ルームを作成します！\n\n・動画を選択\n・ルーム名を設定\n・公開/非公開を選択\n・招待コードを生成\n\nみんなで一緒に推し活を楽しもう！",
    );
  };

  return {
    liveWatchParties,
    handleJoinWatchParty,
    handleCreateWatchParty,
  };
};

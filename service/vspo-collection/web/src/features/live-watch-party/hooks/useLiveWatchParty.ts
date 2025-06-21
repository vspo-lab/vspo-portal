"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [liveWatchParties] = useState<LiveWatchParty[]>(
    initialLiveWatchParties,
  );

  const handleJoinWatchParty = (
    room: LiveWatchParty,
    onPointsAdd: (points: number) => void,
  ) => {
    onPointsAdd(20);
    // Navigate to the watch party room
    router.push(`/watch-party/${room.id}`);
  };

  const handleCreateWatchParty = () => {
    // Navigate to the host dashboard
    router.push("/watch-party/host");
  };

  const handleLeaveWatchParty = () => {
    // In a real app, this would handle leaving the room
    console.log("Leaving watch party...");
  };

  return {
    liveWatchParties,
    handleJoinWatchParty,
    handleCreateWatchParty,
    handleLeaveWatchParty,
  };
};

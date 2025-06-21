"use client";

import { useState } from "react";
import type { LiveWatchParty } from "../../../../common/types/schemas";
import { useOnlineUsers } from "../../../../shared/hooks/useOnlineUsers";
import { useSparkleEffect } from "../../../../shared/hooks/useSparkleEffect";
import { useNavigation } from "../../../navigation/hooks/useNavigation";
import { useUserProfile } from "../../../user/hooks/useUserProfile";
import { useLiveWatchParty } from "../../hooks/useLiveWatchParty";
import { WatchPartyPagePresenter } from "./presenter";

// Mock data for the watch party
const mockWatchParty: LiveWatchParty = {
  id: 1,
  title: "【みおちゃん】新曲初公開！一緒に盛り上がろう！",
  vtuber: "🦄 みおちゃん",
  thumbnail: "/placeholder.svg?height=480&width=854",
  viewers: 2547,
  status: "LIVE",
  startTime: "20:00",
  hostUser: "みお推し太郎",
  hostBadge: "💎",
  roomCode: "MIO-LIVE-001",
  isPopular: true,
};

// Mock chat messages
interface ChatMessage {
  id: number;
  username: string;
  message: string;
  timestamp: string;
  userBadge?: string;
  isHost?: boolean;
  isModerator?: boolean;
}

const mockChatMessages: ChatMessage[] = [
  {
    id: 1,
    username: "みお推し太郎",
    message: "みなさん、ようこそ！今日は新曲初公開です！",
    timestamp: "20:01",
    userBadge: "💎",
    isHost: true,
  },
  {
    id: 2,
    username: "ファン子",
    message: "わー！楽しみ！！",
    timestamp: "20:02",
    userBadge: "🌟",
  },
  {
    id: 3,
    username: "推し活勢",
    message: "みおちゃん最高！！！",
    timestamp: "20:03",
    userBadge: "⚡",
  },
  {
    id: 4,
    username: "新参です",
    message: "初めて参加します！よろしくお願いします",
    timestamp: "20:04",
  },
  {
    id: 5,
    username: "モデレーター",
    message: "みんなで楽しく応援しましょう！荒らしは通報してくださいね",
    timestamp: "20:05",
    isModerator: true,
  },
];

// Mock participants
interface Participant {
  id: number;
  username: string;
  avatar: string;
  badge?: string;
  isHost?: boolean;
  isModerator?: boolean;
}

const mockParticipants: Participant[] = [
  {
    id: 1,
    username: "みお推し太郎",
    avatar: "/placeholder.svg?height=40&width=40",
    badge: "💎",
    isHost: true,
  },
  {
    id: 2,
    username: "モデレーター",
    avatar: "/placeholder.svg?height=40&width=40",
    isModerator: true,
  },
  {
    id: 3,
    username: "ファン子",
    avatar: "/placeholder.svg?height=40&width=40",
    badge: "🌟",
  },
  {
    id: 4,
    username: "推し活勢",
    avatar: "/placeholder.svg?height=40&width=40",
    badge: "⚡",
  },
  {
    id: 5,
    username: "新参です",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: 6,
    username: "みおちゃん大好き",
    avatar: "/placeholder.svg?height=40&width=40",
    badge: "💕",
  },
];

// Mock reactions
interface Reaction {
  id: string;
  emoji: string;
  count: number;
  isActive: boolean;
}

const mockReactions: Reaction[] = [
  { id: "love", emoji: "❤️", count: 1234, isActive: false },
  { id: "fire", emoji: "🔥", count: 856, isActive: true },
  { id: "cry", emoji: "😭", count: 423, isActive: false },
  { id: "laugh", emoji: "😂", count: 612, isActive: false },
  { id: "star", emoji: "⭐", count: 789, isActive: true },
];

export const WatchPartyPageContainer = () => {
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState(mockChatMessages);
  const [reactions, setReactions] = useState(mockReactions);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);

  // Custom hooks
  const { userProfile, addPoints } = useUserProfile();
  const { handleLeaveWatchParty } = useLiveWatchParty();
  const { sparkles, addSparkles } = useSparkleEffect();
  const onlineUsers = useOnlineUsers();
  const navigation = useNavigation();

  // Event handlers
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage: ChatMessage = {
        id: chatMessages.length + 1,
        username: "あなた",
        message: chatMessage,
        timestamp: new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        userBadge: userProfile.level >= 10 ? "⭐" : undefined,
      };
      setChatMessages([...chatMessages, newMessage]);
      setChatMessage("");
      addPoints(2);

      // Add sparkle effect
      addSparkles([
        { x: 70, y: 80 },
        { x: 75, y: 85 },
        { x: 65, y: 82 },
      ]);
    }
  };

  const handleReaction = (reactionId: string) => {
    setReactions(
      reactions.map((r) =>
        r.id === reactionId ? { ...r, count: r.count + 1, isActive: true } : r,
      ),
    );
    addPoints(1);

    // Add sparkle effect at reaction button
    addSparkles([
      { x: 50, y: 60 },
      { x: 52, y: 62 },
      { x: 48, y: 61 },
    ]);
  };

  const handleToggleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode);
  };

  const handleToggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  const handleLeaveParty = () => {
    if (confirm("ウォッチパーティーから退出しますか？")) {
      handleLeaveWatchParty();
      navigation.goToHome();
    }
  };

  const handleShare = () => {
    addPoints(10);
    alert(
      `🔗 ウォッチパーティーをシェア！\n\nルームコード: ${mockWatchParty.roomCode}\n参加URL: https://vspo-colle.com/watch-party/${mockWatchParty.roomCode}\n\n+10ポイント獲得！`,
    );
  };

  const handleReport = () => {
    alert(
      "🚨 通報機能\n\n不適切なコメントやユーザーを通報できます。\nモデレーターが確認後、適切に対処します。",
    );
  };

  return (
    <WatchPartyPagePresenter
      // Watch party data
      watchParty={mockWatchParty}
      participants={mockParticipants}
      chatMessages={chatMessages}
      reactions={reactions}
      // State
      chatMessage={chatMessage}
      setChatMessage={setChatMessage}
      isTheaterMode={isTheaterMode}
      isChatVisible={isChatVisible}
      userProfile={userProfile}
      onlineUsers={onlineUsers}
      sparkles={sparkles}
      // Navigation
      navigation={navigation}
      // Event handlers
      onSendMessage={handleSendMessage}
      onReaction={handleReaction}
      onToggleTheaterMode={handleToggleTheaterMode}
      onToggleChat={handleToggleChat}
      onLeaveParty={handleLeaveParty}
      onShare={handleShare}
      onReport={handleReport}
    />
  );
};

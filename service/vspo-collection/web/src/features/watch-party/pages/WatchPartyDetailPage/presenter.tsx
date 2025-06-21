"use client";

import Image from "next/image";
import Link from "next/link";
import type { Clip } from "../../../../common/types/schemas";
import { SparkleEffect } from "../../../../shared/components/presenters/SparkleEffect";
import type { UserProfile } from "../../../user/hooks/useUserProfile";
import { OBSOverlayConfigComponent } from "../../components/OBSOverlayConfig";
import { ViewerVideoPlayer } from "../../components/ViewerVideoPlayer";
import type { Video, WatchPartyRoom } from "../../types";

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: "message" | "system" | "emoji";
}

interface Participant {
  id: string;
  username: string;
  avatar: string;
  joinedAt: string;
  isHost: boolean;
  isModerator: boolean;
}

interface WatchPartyDetailPagePresenterProps {
  // Data
  watchParty: WatchPartyRoom;
  clip: (Clip & { url: string; description?: string; tags: string[] }) | null;
  relatedClips: Clip[];
  userProfile: UserProfile | null;
  sparkles: Array<{ x: number; y: number }>;
  chatMessages: ChatMessage[];
  participants: Participant[];
  reactions: { [key: string]: number };
  currentVideo: Video | null;

  // State
  isJoined: boolean;
  isVideoPlaying: boolean;
  currentTime: number;
  newMessage: string;
  showInviteModal: boolean;
  showSettingsModal: boolean;

  // Event handlers
  onBack: () => void;
  onJoinParty: () => void;
  onLeaveParty: () => void;
  onPlayPause: () => void;
  onTimeSeek: (time: number) => void;
  onNewMessageChange: (message: string) => void;
  onSendMessage: () => void;
  onReaction: (emoji: string) => void;
  onInviteFriends: () => void;
  onCloseInvite: () => void;
  onCopyInviteLink: () => void;
  onShareInvite: (platform: string) => void;
  onShowSettings: () => void;
  onCloseSettings: () => void;
  onRelatedClipClick: (clip: Clip) => void;
  onCreateNewParty: () => void;
}

export const WatchPartyDetailPagePresenter = ({
  // Data
  watchParty,
  clip,
  relatedClips,
  userProfile,
  sparkles,
  chatMessages,
  participants,
  reactions,
  currentVideo,

  // State
  isJoined,
  isVideoPlaying,
  currentTime,
  newMessage,
  showInviteModal,
  showSettingsModal,

  // Event handlers
  onBack,
  onJoinParty,
  onLeaveParty,
  onPlayPause,
  onTimeSeek,
  onNewMessageChange,
  onSendMessage,
  onReaction,
  onInviteFriends,
  onCloseInvite,
  onCopyInviteLink,
  onShareInvite,
  onShowSettings,
  onCloseSettings,
  onRelatedClipClick,
  onCreateNewParty,
}: WatchPartyDetailPagePresenterProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderVideoPlayer = () => (
    <ViewerVideoPlayer
      room={watchParty}
      currentVideo={currentVideo}
      className="w-full"
    />
  );

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <SparkleEffect sparkles={sparkles} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold">{watchParty.title}</h1>
          <div className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
            {watchParty.status === "LIVE" ? "🔴 LIVE" : "📅 予定"}
          </div>
        </div>

        {!isJoined ? (
          <button
            onClick={onJoinParty}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            🎉 参加する
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onInviteFriends}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              👥 招待
            </button>
            <button
              onClick={onLeaveParty}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🚪 退出
            </button>
          </div>
        )}
      </div>

      {/* Watch party info */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {watchParty.hostName?.[0] || "H"}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{watchParty.title}</h3>
            <p className="text-gray-600">
              ホスト: {watchParty.hostName || watchParty.hostUser}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {participants.length}
            </div>
            <div className="text-sm text-gray-600">人参加中</div>
          </div>
        </div>
        {watchParty.description && (
          <p className="text-gray-700">{watchParty.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main video area */}
        <div className="lg:col-span-2">
          {renderVideoPlayer()}

          {/* Reactions */}
          {isJoined && (
            <div className="bg-white rounded-lg p-4 shadow-md mt-6">
              <h3 className="font-bold mb-3">リアクション</h3>
              <div className="flex gap-3">
                {["👍", "❤️", "😂", "😮", "👏"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onReaction(emoji)}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-xl transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Video info */}
          {clip && (
            <div className="bg-white rounded-lg p-6 shadow-md mt-6">
              <h3 className="font-bold mb-3">視聴中の動画</h3>
              <div className="flex gap-4">
                <div className="w-32 h-20 relative flex-shrink-0">
                  <Image
                    src={clip.thumbnail}
                    alt={clip.title}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">{clip.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    {clip.vtuber} • {clip.clipper}
                  </p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{clip.views} 視聴</span>
                    <span>{clip.likes.toLocaleString()} いいね</span>
                    <span>{clip.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Participants */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">参加者</h3>
              <span className="text-sm text-gray-600">
                {participants.length}人
              </span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {participant.username[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {participant.username}
                      </span>
                      {participant.isHost && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          ホスト
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="font-bold mb-4">チャット</h3>

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {chatMessages.slice(-10).map((message) => (
                <div key={message.id} className="flex gap-2">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {message.username[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-xs">
                        {message.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString(
                          "ja-JP",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                    <p
                      className={`text-sm ${
                        message.type === "system"
                          ? "text-gray-500 italic"
                          : message.type === "emoji"
                            ? "text-2xl"
                            : "text-gray-700"
                      }`}
                    >
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {isJoined && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => onNewMessageChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
                  placeholder="メッセージを入力..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={onSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  送信
                </button>
              </div>
            )}
          </div>

          {/* OBS Overlay Config (only for host) */}
          {isJoined &&
            participants.find(
              (p) =>
                p.isHost &&
                p.username === (userProfile?.name || userProfile?.username),
            ) && (
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="font-bold mb-4">配信設定</h3>
                <OBSOverlayConfigComponent roomId={watchParty.id} />
              </div>
            )}

          {/* Related clips */}
          {relatedClips.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-bold mb-4">関連動画</h3>
              <div className="space-y-3">
                {relatedClips.slice(0, 3).map((relatedClip) => (
                  <div
                    key={relatedClip.id}
                    className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => onRelatedClipClick(relatedClip)}
                  >
                    <div className="w-16 h-12 relative flex-shrink-0">
                      <Image
                        src={relatedClip.thumbnail}
                        alt={relatedClip.title}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {relatedClip.title}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {relatedClip.views}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">友達を招待</h3>

            <div className="space-y-3 mb-6">
              <button
                onClick={onCopyInviteLink}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl">📋</span>
                <span>招待リンクをコピー</span>
              </button>
              <button
                onClick={() => onShareInvite("twitter")}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="text-xl">🐦</span>
                <span>Twitterで共有</span>
              </button>
              <button
                onClick={() => onShareInvite("line")}
                className="w-full flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <span className="text-xl">💬</span>
                <span>LINEで共有</span>
              </button>
              <button
                onClick={() => onShareInvite("discord")}
                className="w-full flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <span className="text-xl">🎮</span>
                <span>Discordで共有</span>
              </button>
            </div>

            <button
              onClick={onCloseInvite}
              className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* User profile display */}
      {userProfile && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {userProfile.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-sm">{userProfile.name}</div>
              <div className="text-xs text-gray-600">
                {userProfile.points.toLocaleString()}pt
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

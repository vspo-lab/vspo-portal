"use client";

import Image from "next/image";
import Link from "next/link";
import type { Creator } from "../../../../common/types/creator";
import type {
  Clip,
  Sparkle,
  UserProfile,
} from "../../../../common/types/schemas";
import { SparkleEffect } from "../../../../shared/components/presenters/SparkleEffect";

interface Comment {
  id: number;
  user: string;
  comment: string;
  timestamp: string;
  likes: number;
}

interface ClipDetailPagePresenterProps {
  // Data
  clip: Clip & { url: string; description?: string; tags: string[] };
  vtuber: Creator | null;
  relatedClips: Clip[];
  recommendedClips: Clip[];
  userProfile: UserProfile | null;
  sparkles: Sparkle[];
  comments: Comment[];

  // State
  isLiked: boolean;
  isFollowingVTuber: boolean;
  isPlaying: boolean;
  currentTime: number;
  showShareModal: boolean;
  showWatchPartyModal: boolean;
  newComment: string;

  // Event handlers
  onBack: () => void;
  onLike: () => void;
  onFollowVTuber: () => void;
  onShare: () => void;
  onCloseShare: () => void;
  onSharePlatform: (platform: string) => void;
  onAddToPlaylist: () => void;
  onCreateWatchParty: () => void;
  onCloseWatchParty: () => void;
  onStartWatchParty: () => void;
  onJoinWatchParty: () => void;
  onRelatedClipClick: (clip: Clip) => void;
  onVTuberClick: () => void;
  onPlayStateChange: (playing: boolean) => void;
  onTimeUpdate: (time: number) => void;
  onNewCommentChange: (comment: string) => void;
  onAddComment: () => void;
  onCommentLike: (commentId: number) => void;
}

export const ClipDetailPagePresenter = ({
  // Data
  clip,
  vtuber,
  relatedClips,
  recommendedClips,
  userProfile,
  sparkles,
  comments,

  // State
  isLiked,
  isFollowingVTuber,
  isPlaying,
  currentTime,
  showShareModal,
  showWatchPartyModal,
  newComment,

  // Event handlers
  onBack,
  onLike,
  onFollowVTuber,
  onShare,
  onCloseShare,
  onSharePlatform,
  onAddToPlaylist,
  onCreateWatchParty,
  onCloseWatchParty,
  onStartWatchParty,
  onJoinWatchParty,
  onRelatedClipClick,
  onVTuberClick,
  onPlayStateChange,
  onTimeUpdate,
  onNewCommentChange,
  onAddComment,
  onCommentLike,
}: ClipDetailPagePresenterProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderVideoPlayer = () => (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      {/* Placeholder video player - in real implementation, use proper video component */}
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
            {isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
          <p className="text-lg font-medium">{clip.title}</p>
          <p className="text-sm text-gray-300 mt-2">
            {isPlaying ? "Playing" : "Click to play"} •{" "}
            {formatTime(currentTime)} / {clip.duration}
          </p>
          <button
            onClick={() => onPlayStateChange(!isPlaying)}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isPlaying ? "⏸️ 一時停止" : "▶️ 再生"}
          </button>
        </div>
      </div>

      {/* Video overlay controls */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-4 text-white">
            <button onClick={() => onPlayStateChange(!isPlaying)}>
              {isPlaying ? "⏸️" : "▶️"}
            </button>
            <div className="flex-1 bg-gray-600 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all"
                style={{ width: "30%" }}
              />
            </div>
            <span className="text-sm">
              {formatTime(currentTime)} / {clip.duration}
            </span>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      {clip.watchPartyActive && (
        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
          🔴 LIVE WATCH PARTY
        </div>
      )}

      {/* Exclusive indicator */}
      {clip.isExclusive && (
        <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          ⭐ 限定動画
        </div>
      )}
    </div>
  );

  const renderClipCard = (clipItem: Clip, onClick: () => void) => (
    <div
      key={clipItem.id}
      className="flex gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="relative w-24 h-16 flex-shrink-0">
        <Image
          src={clipItem.thumbnail}
          alt={clipItem.title}
          fill
          className="object-cover rounded"
        />
        <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
          {clipItem.duration}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-2 mb-1">
          {clipItem.title}
        </h4>
        <p className="text-xs text-gray-600 mb-1">{clipItem.vtuber}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{clipItem.views}</span>
          <span>{clipItem.likes.toLocaleString()} いいね</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <SparkleEffect sparkles={sparkles} />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/" className="hover:text-blue-600">
          ホーム
        </Link>
        <span>/</span>
        <Link href="/clips" className="hover:text-blue-600">
          切り抜き動画
        </Link>
        <span>/</span>
        <span className="text-gray-900 truncate">{clip.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Video player */}
          {renderVideoPlayer()}

          {/* Video info */}
          <div className="mt-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {clip.title}
            </h1>

            {/* Stats and meta info */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-gray-600">
              <span>{clip.views} 回視聴</span>
              <span>{clip.likes.toLocaleString()} いいね</span>
              <span>{clip.comments} コメント</span>
              <span>by {clip.clipper}</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={onLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isLiked
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                💕 {isLiked ? "いいね済み" : "いいね"}
              </button>
              <button
                onClick={onShare}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                📤 共有
              </button>
              <button
                onClick={onAddToPlaylist}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                📋 プレイリストに追加
              </button>
              {clip.watchPartyActive ? (
                <button
                  onClick={onJoinWatchParty}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                >
                  🎉 ウォッチパーティに参加
                </button>
              ) : (
                <button
                  onClick={onCreateWatchParty}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  🎉 ウォッチパーティ作成
                </button>
              )}
            </div>

            {/* Tags */}
            {clip.tags && clip.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {clip.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* VTuber info */}
          {vtuber && (
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full overflow-hidden border-2 cursor-pointer"
                  style={{ borderColor: vtuber.color || "#e5e7eb" }}
                  onClick={onVTuberClick}
                >
                  <Image
                    src={vtuber.avatar}
                    alt={vtuber.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 cursor-pointer" onClick={onVTuberClick}>
                  <h3 className="font-bold text-lg">{vtuber.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {vtuber.description}
                  </p>
                  {vtuber.stats && (
                    <p className="text-xs text-gray-500 mt-1">
                      {vtuber.stats.totalClips.toLocaleString()}本の動画 •{" "}
                      {vtuber.stats.totalViews} 総再生回数
                    </p>
                  )}
                </div>
                <button
                  onClick={onFollowVTuber}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isFollowingVTuber
                      ? "bg-gray-200 text-gray-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isFollowingVTuber ? "✓ フォロー中" : "+ フォロー"}
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          {clip.description && (
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <h3 className="font-bold mb-3">詳細</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {clip.description}
              </p>
            </div>
          )}

          {/* Comments section */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="font-bold mb-4">コメント ({comments.length})</h3>

            {/* Add comment */}
            {userProfile && (
              <div className="mb-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {userProfile.username.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => onNewCommentChange(e.target.value)}
                      placeholder="コメントを追加..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={onAddComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        投稿
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {comment.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.user}
                      </span>
                      <span className="text-xs text-gray-500">
                        {comment.timestamp}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">
                      {comment.comment}
                    </p>
                    <button
                      onClick={() => onCommentLike(comment.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      👍 {comment.likes}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related clips */}
          {relatedClips.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-bold mb-4">{clip.vtuber}の他の動画</h3>
              <div className="space-y-3">
                {relatedClips
                  .slice(0, 5)
                  .map((relatedClip) =>
                    renderClipCard(relatedClip, () =>
                      onRelatedClipClick(relatedClip),
                    ),
                  )}
              </div>
            </div>
          )}

          {/* Recommended clips */}
          {recommendedClips.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-bold mb-4">おすすめ動画</h3>
              <div className="space-y-3">
                {recommendedClips
                  .slice(0, 4)
                  .map((recommendedClip) =>
                    renderClipCard(recommendedClip, () =>
                      onRelatedClipClick(recommendedClip),
                    ),
                  )}
              </div>
            </div>
          )}

          {/* Watch party info */}
          {clip.watchPartyActive && (
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h3 className="font-bold text-green-800 mb-3">
                🎉 ライブウォッチパーティ開催中！
              </h3>
              <p className="text-green-700 text-sm mb-4">
                みんなで一緒にこの動画を楽しもう！リアルタイムでコメントや反応を共有できます。
              </p>
              <button
                onClick={onJoinWatchParty}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                ウォッチパーティに参加
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">「{clip.title}」を共有</h3>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => onSharePlatform("twitter")}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="text-xl">🐦</span>
                <span>Twitterで共有</span>
              </button>
              <button
                onClick={() => onSharePlatform("facebook")}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="text-xl">📘</span>
                <span>Facebookで共有</span>
              </button>
              <button
                onClick={() => onSharePlatform("line")}
                className="w-full flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <span className="text-xl">💬</span>
                <span>LINEで共有</span>
              </button>
              <button
                onClick={() => onSharePlatform("copy")}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl">📋</span>
                <span>URLをコピー</span>
              </button>
            </div>

            <button
              onClick={onCloseShare}
              className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Watch party modal */}
      {showWatchPartyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              🎉 ウォッチパーティを作成
            </h3>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                「{clip.title}」のウォッチパーティを作成しますか？
              </p>
              <p className="text-sm text-gray-500">
                ウォッチパーティでは、他のユーザーと一緒に動画を視聴し、
                リアルタイムでコメントや反応を共有できます。
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCloseWatchParty}
                className="flex-1 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={onStartWatchParty}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                作成する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User profile display */}
      {userProfile && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {userProfile.username.charAt(0)}
            </div>
            <div>
              <div className="font-medium text-sm">{userProfile.username}</div>
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

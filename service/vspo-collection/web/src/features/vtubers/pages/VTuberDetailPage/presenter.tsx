"use client";

import Image from "next/image";
import Link from "next/link";
import type { Creator } from "../../../../common/types/creator";
import type { Clip } from "../../../../common/types/schemas";
import type { Sparkle, UserProfile } from "../../../../common/types/schemas";
import { BackButton } from "../../../../shared/components/BackButton";
import { Breadcrumbs } from "../../../../shared/components/Breadcrumbs";
import { SparkleEffect } from "../../../../shared/components/presenters/SparkleEffect";
import { useNavigation } from "../../../navigation/hooks/useNavigation";

interface VTuberDetailPagePresenterProps {
  // Data
  vtuber: Creator;
  clips: Clip[];
  trendingClips: Clip[];
  totalClips: number;
  userProfile: UserProfile | null;
  sparkles: Sparkle[];

  // State
  activeTab: string;
  sortBy: string;
  isFollowing: boolean;
  showShareModal: boolean;
  selectedClip: Clip | null;

  // Event handlers
  onBack: () => void;
  onFollow: () => void;
  onShare: () => void;
  onCloseShare: () => void;
  onSharePlatform: (platform: string) => void;
  onTabChange: (tab: string) => void;
  onSortChange: (sort: string) => void;
  onClipClick: (clip: Clip) => void;
  onClipLike: (clip: Clip) => void;
  onClipShare: (clip: Clip) => void;
  onWatchPartyJoin: (clip: Clip) => void;
  onCreatePlaylist: () => void;
  onSubscribeToUpdates: () => void;
}

export const VTuberDetailPagePresenter = ({
  // Data
  vtuber,
  clips,
  trendingClips,
  totalClips,
  userProfile,
  sparkles,

  // State
  activeTab,
  sortBy,
  isFollowing,
  showShareModal,
  selectedClip,

  // Event handlers
  onBack,
  onFollow,
  onShare,
  onCloseShare,
  onSharePlatform,
  onTabChange,
  onSortChange,
  onClipClick,
  onClipLike,
  onClipShare,
  onWatchPartyJoin,
  onCreatePlaylist,
  onSubscribeToUpdates,
}: VTuberDetailPagePresenterProps) => {
  const { breadcrumbs } = useNavigation();
  const renderClipCard = (clip: Clip) => (
    <div
      key={clip.id}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClipClick(clip)}
    >
      <div className="relative aspect-video">
        <Image
          src={clip.thumbnail}
          alt={clip.title}
          fill
          className="object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {clip.duration}
        </div>
        {clip.watchPartyActive && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            🎉 LIVE
          </div>
        )}
        {clip.isExclusive && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
            ⭐ 限定
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-sm mb-2 line-clamp-2">{clip.title}</h3>
        <p className="text-gray-600 text-xs mb-2">by {clip.clipper}</p>

        <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
          <span>{clip.views} 視聴</span>
          <span>{clip.likes.toLocaleString()} いいね</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClipLike(clip);
            }}
            className="flex-1 bg-red-50 text-red-600 text-xs py-1 px-2 rounded hover:bg-red-100 transition-colors"
          >
            💕 いいね
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClipShare(clip);
            }}
            className="flex-1 bg-blue-50 text-blue-600 text-xs py-1 px-2 rounded hover:bg-blue-100 transition-colors"
          >
            📤 共有
          </button>
          {clip.watchPartyActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWatchPartyJoin(clip);
              }}
              className="flex-1 bg-green-50 text-green-600 text-xs py-1 px-2 rounded hover:bg-green-100 transition-colors"
            >
              🎉 参加
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <SparkleEffect sparkles={sparkles} />

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <BackButton onClick={onBack} />
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 shadow-lg"
            style={{ borderColor: vtuber.color || "#e5e7eb" }}
          >
            <Image
              src={vtuber.avatar}
              alt={`${vtuber.name}のアバター`}
              width={192}
              height={192}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* VTuber info */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {vtuber.name}
              </h1>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-3 py-1 rounded-full text-white text-sm font-medium"
                  style={{ backgroundColor: vtuber.color || "#6b7280" }}
                >
                  {vtuber.memberType?.replace("_", " ").toUpperCase()}
                </span>
                {vtuber.isActive && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    🟢 配信中
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={onFollow}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isFollowing
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isFollowing ? "✓ フォロー中" : "+ フォロー"}
              </button>
              <button
                onClick={onShare}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                📤 共有
              </button>
              <button
                onClick={onSubscribeToUpdates}
                className="px-6 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium hover:bg-yellow-200 transition-colors"
              >
                🔔 通知
              </button>
            </div>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {vtuber.description}
          </p>

          {/* Stats */}
          {vtuber.stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {vtuber.stats.totalClips.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">切り抜き動画</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {vtuber.stats.totalViews}
                </div>
                <div className="text-sm text-gray-600">総再生回数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {vtuber.stats.monthlyViewers}
                </div>
                <div className="text-sm text-gray-600">月間視聴者</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {vtuber.stats.favoriteCount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">お気に入り</div>
              </div>
            </div>
          )}

          {/* Platform links */}
          <div className="flex gap-4 mb-6">
            {vtuber.platformLinks?.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="text-lg">
                  {link.platform === "youtube" && "🎥"}
                  {link.platform === "twitch" && "🟣"}
                  {link.platform === "twitter" && "🐦"}
                  {link.platform === "twitcasting" && "📺"}
                </span>
                <div className="text-sm">
                  <div className="font-medium">
                    {link.platform.toUpperCase()}
                  </div>
                  {link.subscriberCount && (
                    <div className="text-gray-600">
                      {link.subscriberCount.toLocaleString()}人
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>

          {/* Tags */}
          {vtuber.tags && vtuber.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {vtuber.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-4 mb-8 overflow-x-auto">
        <button
          onClick={onCreatePlaylist}
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors whitespace-nowrap"
        >
          📋 プレイリスト作成
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors whitespace-nowrap">
          🎯 おすすめ動画
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors whitespace-nowrap">
          📊 統計情報
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8 overflow-x-auto">
          {[
            { id: "clips", label: "切り抜き動画", count: totalClips },
            { id: "trending", label: "トレンド", count: trendingClips.length },
            { id: "playlists", label: "プレイリスト", count: 12 },
            { id: "stats", label: "統計", count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content area */}
      <div className="mb-8">
        {activeTab === "clips" && (
          <div>
            {/* Sort controls */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">切り抜き動画 ({totalClips})</h2>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="latest">最新順</option>
                <option value="popular">人気順</option>
                <option value="views">再生回数順</option>
                <option value="duration">動画時間順</option>
              </select>
            </div>

            {/* Clips grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {clips.map(renderClipCard)}
            </div>
          </div>
        )}

        {activeTab === "trending" && (
          <div>
            <h2 className="text-xl font-bold mb-6">トレンド動画</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingClips.map(renderClipCard)}
            </div>
          </div>
        )}

        {activeTab === "playlists" && (
          <div>
            <h2 className="text-xl font-bold mb-6">プレイリスト</h2>
            <div className="text-center py-12 text-gray-500">
              <p>プレイリスト機能は準備中です</p>
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div>
            <h2 className="text-xl font-bold mb-6">統計情報</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="font-bold mb-4">月別統計</h3>
                <div className="text-center py-8 text-gray-500">
                  <p>グラフ表示は準備中です</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="font-bold mb-4">カテゴリ別分析</h3>
                <div className="text-center py-8 text-gray-500">
                  <p>分析データは準備中です</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {selectedClip
                ? `"${selectedClip.title}"を共有`
                : `${vtuber.name}を共有`}
            </h3>

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

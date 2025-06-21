import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Pause,
  Play,
  Plus,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import type {
  Playlist,
  Sparkle,
  UserProfile,
} from "../../../../common/types/schemas";
import { BackButton } from "../../../../shared/components/BackButton";
import { Breadcrumbs } from "../../../../shared/components/Breadcrumbs";
import { RelatedContent } from "../../../../shared/components/RelatedContent";
import { Button } from "../../../../shared/components/presenters/Button";
import { SparkleEffect } from "../../../../shared/components/presenters/SparkleEffect";
import { useNavigation } from "../../../navigation/hooks/useNavigation";
import type { PlaylistVideo } from "../../types";

interface PlaylistDetailPagePresenterProps {
  // State
  playlist: Playlist | null;
  relatedPlaylists: Playlist[];
  recommendedPlaylists: Playlist[];
  isLoading: boolean;
  error: string | null;
  userProfile: UserProfile;
  sparkles: Sparkle[];
  isPlaying: boolean;
  currentVideoIndex: number;
  showVideoDetails: number | null;
  isFollowing: boolean;
  autoplay?: boolean;

  // Event handlers
  onBack: () => void;
  onFollowToggle: () => void;
  onPlayPlaylist: () => void;
  onVideoPlay: (video: PlaylistVideo, index: number) => void;
  onVideoLike: (videoId: number) => void;
  onAddToQueue: (video: PlaylistVideo) => void;
  onRemoveVideo: (videoId: number) => void;
  onVideoDetailsToggle: (videoId: number) => void;
  onSharePlaylist: () => void;
  onWatchPartyCreate: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onShuffle: () => void;
}

export const PlaylistDetailPagePresenter = ({
  playlist,
  relatedPlaylists,
  recommendedPlaylists,
  isLoading,
  error,
  userProfile,
  sparkles,
  isPlaying,
  currentVideoIndex,
  showVideoDetails,
  isFollowing,
  autoplay,
  onBack,
  onFollowToggle,
  onPlayPlaylist,
  onVideoPlay,
  onVideoLike,
  onAddToQueue,
  onRemoveVideo,
  onVideoDetailsToggle,
  onSharePlaylist,
  onWatchPartyCreate,
  onNext,
  onPrevious,
  onShuffle,
}: PlaylistDetailPagePresenterProps) => {
  const { breadcrumbs } = useNavigation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">プレイリストを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "プレイリストが見つかりませんでした"}
          </p>
          <BackButton
            onClick={onBack}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
      <SparkleEffect sparkles={sparkles} />

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <BackButton
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
            />

            <div className="text-sm text-gray-600">
              Lv.{userProfile.level} | {userProfile.points.toLocaleString()}pt
            </div>
          </div>

          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbs} className="mt-2" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Playlist Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
              <div className="relative mb-6">
                <img
                  src={playlist.thumbnail}
                  alt={playlist.title}
                  className="w-full h-48 object-cover rounded-xl"
                />
                {playlist.isHot && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-400 to-red-400 text-white px-3 py-1 rounded-full text-sm font-medium">
                    🔥 HOT
                  </div>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-800 mb-3 line-clamp-3">
                {playlist.title}
              </h1>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                  {playlist.creator.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">
                      {playlist.creator}
                    </span>
                    <span className="text-lg">{playlist.creatorBadge}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {isFollowing ? "フォロー中" : ""}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                {playlist.topVideo}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="text-center p-3 bg-purple-50 rounded-xl">
                  <div className="font-bold text-purple-600">
                    {playlist.videoCount}
                  </div>
                  <div className="text-gray-600">動画</div>
                </div>
                <div className="text-center p-3 bg-pink-50 rounded-xl">
                  <div className="font-bold text-pink-600">
                    {playlist.views}
                  </div>
                  <div className="text-gray-600">再生回数</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <div className="font-bold text-blue-600">
                    {playlist.watchPartyCount}
                  </div>
                  <div className="text-gray-600">ウォッチパーティ</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <div className="font-bold text-green-600">
                    {playlist.likes.toLocaleString()}
                  </div>
                  <div className="text-gray-600">いいね</div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={onPlayPlaylist}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  {isPlaying ? "一時停止" : "すべて再生"}
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={onFollowToggle}
                    className={`flex-1 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      isFollowing
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isFollowing ? "fill-current" : ""}`}
                    />
                    {isFollowing ? "フォロー中" : "フォロー"}
                  </Button>

                  <Button
                    onClick={onSharePlaylist}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    共有
                  </Button>
                </div>

                <Button
                  onClick={onWatchPartyCreate}
                  className="w-full py-2 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-xl font-medium hover:from-orange-500 hover:to-red-500 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  ウォッチパーティを作成
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {playlist.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 bg-purple-50 text-purple-600 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-3 h-3" />
                  作成日: 2024年1月15日
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  更新日: 2024年6月19日
                </div>
              </div>
            </div>
          </div>

          {/* Video List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">動画一覧</h2>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={onShuffle}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                    title="シャッフル"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                  <div className="text-sm text-gray-600">
                    {playlist.videoCount}本の動画
                  </div>
                </div>
              </div>

              {/* Now Playing */}
              {isPlaying && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border border-purple-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-gray-700">
                        再生中
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={onPrevious}
                        disabled={currentVideoIndex === 0}
                        className="p-1 text-gray-600 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={onNext}
                        disabled={currentVideoIndex === playlist.videoCount - 1}
                        className="p-1 text-gray-600 hover:text-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-800">
                    動画 {currentVideoIndex + 1} - {playlist.topVideo}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {currentVideoIndex + 1} / {playlist.videoCount}
                  </div>
                </div>
              )}

              {/* Video List Placeholder */}
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  プレイリスト詳細機能開発中
                </h3>
                <p className="text-gray-600 mb-4">
                  このプレイリストには{playlist.videoCount}
                  本の動画が含まれています。
                </p>
                <p className="text-sm text-gray-500">
                  メイン動画: {playlist.topVideo}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Content */}
        <div className="mt-12 space-y-8">
          <RelatedContent
            title="関連プレイリスト"
            items={[
              {
                id: "related-1",
                type: "playlist",
                title: `${playlist.creator} のその他のプレイリスト`,
                href: `/playlists/creator/${playlist.creator}`,
                thumbnail: playlist.thumbnail,
                metadata: {
                  views: "12.5K",
                  creator: playlist.creator,
                  duration: "2:15:30",
                },
                description: "同じクリエイターによる他のプレイリスト",
                isHot: true,
              },
              {
                id: "related-2",
                type: "playlist",
                title: "似たような動画のプレイリスト",
                href: `/playlists/similar/${playlist.id}`,
                thumbnail: "/placeholder.svg?height=180&width=320&text=Similar",
                metadata: {
                  views: "8.9K",
                  creator: "おすすめキュレーター",
                  duration: "1:45:20",
                },
                description: "このプレイリストに似た内容の動画集",
              },
              {
                id: "related-3",
                type: "vtuber",
                title: "関連VTuber",
                href: "/vtubers/related",
                thumbnail: "/placeholder.svg?height=180&width=320&text=VTuber",
                metadata: {
                  views: "156K",
                  creator: "VTuber公式",
                },
                description: "このプレイリストに関連するVTuber",
              },
            ]}
            maxItems={3}
          />

          <RelatedContent
            title="最近見た動画から"
            items={[
              {
                id: "recent-1",
                type: "clip",
                title: "おすすめ切り抜き動画",
                href: "/clips/recommended",
                thumbnail: "/placeholder.svg?height=180&width=320&text=Clip",
                metadata: {
                  views: "45.2K",
                  duration: "8:45",
                  creator: "切り抜き師",
                  date: "2日前",
                },
                description: "視聴履歴に基づくおすすめ動画",
                isNew: true,
              },
              {
                id: "recent-2",
                type: "watchparty",
                title: "進行中のウォッチパーティ",
                href: "/watch-party/active",
                thumbnail: "/placeholder.svg?height=180&width=320&text=Party",
                metadata: {
                  members: 24,
                  creator: "パーティーホスト",
                },
                description: "今すぐ参加できるウォッチパーティ",
                isHot: true,
              },
            ]}
            layout="list"
            maxItems={2}
          />
        </div>
      </div>
    </div>
  );
};

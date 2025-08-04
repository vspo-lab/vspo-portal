"use client";

import {
  ExternalLink,
  Heart,
  Link2,
  MessageSquare,
  Star,
  Volume2,
  X,
} from "lucide-react";
import type {
  Category,
  Member,
  VoiceClip,
} from "../../domain/models/voice-clip.model";
import { AudioPlayer } from "../presenters/audio-player";

interface ClipDetailModalProps {
  clip: VoiceClip;
  member: Member;
  categories: Category[];
  isLiked: boolean;
  isFavorite: boolean;
  isPlaying: boolean;
  onClose: () => void;
  onPlay: () => void;
  onLike: () => void;
  onFavorite: () => void;
}

export function ClipDetailModal({
  clip,
  member,
  categories,
  isLiked,
  isFavorite,
  isPlaying,
  onClose,
  onPlay,
  onLike,
  onFavorite,
}: ClipDetailModalProps) {
  const handleShare = () => {
    const shareText = `${member.name}の「${clip.title}」を聴いています！ #Vspo #ぶいすぽ`;
    const shareUrl = clip.clipUrl || clip.sourceUrl;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 dark:bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-amber-600/30 shadow-xl dark:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-amber-600/20">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white dark:text-zinc-900 font-bold flex-shrink-0"
                style={{ backgroundColor: member.color }}
              >
                {member.avatar}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-amber-100">
                  {clip.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                  {member.name}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {clip.categories.map((categoryId) => {
                    const category = categories.find(
                      (c) => c.id === categoryId,
                    );
                    return category ? (
                      <span
                        key={categoryId}
                        className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-600/30"
                      >
                        {category.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-amber-100" />
            </button>
          </div>
        </div>

        {/* Modal content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Audio player */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-amber-200 mb-3">
              音声を再生
            </h3>
            <AudioPlayer
              audioUrl={clip.audioUrl}
              isPlaying={isPlaying}
              onPlayStateChange={() => onPlay()}
            />
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-amber-200 mb-3">
              関連リンク
            </h3>
            <div className="space-y-2">
              <a
                href={clip.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-100 dark:bg-zinc-700 rounded-lg text-gray-900 dark:text-amber-100 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Link2 className="w-5 h-5" />
                  <div>
                    <p className="font-medium">元配信を見る</p>
                    <p className="text-xs text-gray-600 dark:text-zinc-400">
                      タイムスタンプ: {clip.timestamp}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4" />
              </a>

              {clip.clipUrl && (
                <a
                  href={clip.clipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-100 dark:bg-zinc-700 rounded-lg text-gray-900 dark:text-amber-100 hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-5 h-5" />
                    <p className="font-medium">切り抜き動画を見る</p>
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Uploader comment */}
          {clip.uploaderComment && (
            <div className="bg-gray-100 dark:bg-zinc-700/50 rounded-lg p-4 border border-gray-200 dark:border-amber-600/20">
              <h3 className="text-sm font-medium text-gray-700 dark:text-amber-200 mb-2 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>投稿者より</span>
              </h3>
              <p className="text-sm text-gray-700 dark:text-amber-100/90 leading-relaxed">
                {clip.uploaderComment}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onLike}
                className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg font-medium transition-colors ${
                  isLiked
                    ? "bg-amber-100 dark:bg-amber-600/20 text-amber-600 dark:text-amber-500"
                    : "bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-amber-100 hover:bg-gray-200 dark:hover:bg-zinc-600"
                }`}
              >
                <Heart
                  className="w-5 h-5"
                  fill={isLiked ? "currentColor" : "none"}
                />
                <span>いいね</span>
              </button>

              <button
                type="button"
                onClick={onFavorite}
                className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg font-medium transition-colors ${
                  isFavorite
                    ? "bg-amber-600 text-white dark:text-zinc-900"
                    : "bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-amber-100 hover:bg-gray-200 dark:hover:bg-zinc-600"
                }`}
              >
                <Star
                  className="w-5 h-5"
                  fill={isFavorite ? "currentColor" : "none"}
                />
                <span>お気に入り</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-100 dark:bg-zinc-700 rounded-lg text-gray-700 dark:text-amber-100 hover:bg-gray-200 dark:hover:bg-zinc-600 font-medium transition-colors"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-label="X (Twitter)"
              >
                <title>X (Twitter)</title>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Xでシェア</span>
            </button>
          </div>

          {/* Statistics */}
          <div className="pt-4 border-t border-gray-200 dark:border-amber-600/20">
            <div className="flex justify-around text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-amber-100">
                  {clip.views.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 dark:text-zinc-500">
                  再生回数
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-amber-100">
                  {clip.likes.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 dark:text-zinc-500">
                  いいね
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

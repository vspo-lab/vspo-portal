"use client";

import { Plus, Send, X } from "lucide-react";
import { useState } from "react";
import type { ClipRequest } from "../../domain/models/voice-clip.model";

interface ClipRequestModalProps {
  onClose: () => void;
  onSubmit: (request: ClipRequest) => void;
}

export function ClipRequestModal({ onClose, onSubmit }: ClipRequestModalProps) {
  const [requestForm, setRequestForm] = useState<ClipRequest>({
    title: "",
    sourceUrl: "",
    clipUrl: "",
    xUrl: "",
    comment: "",
  });

  const handleInputChange = (field: keyof ClipRequest, value: string) => {
    setRequestForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmit(requestForm);
  };

  const isValid = requestForm.title && requestForm.sourceUrl;

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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-amber-100">
                ボイスクリップをリクエスト
              </h2>
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

        {/* Request form */}
        <div className="p-4 md:p-6 space-y-6">
          <div className="text-sm text-gray-700 dark:text-amber-100/80 mb-4">
            <p>Vspo!メンバーの音声クリップをリクエストできます。</p>
            <p className="mt-1 text-gray-600 dark:text-zinc-400">
              できるだけ詳しい情報を入力してください。
            </p>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="request-title"
              className="text-sm font-medium text-gray-700 dark:text-amber-200 mb-2 block"
            >
              音声のタイトル{" "}
              <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              id="request-title"
              type="text"
              value={requestForm.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="例: すみれちゃんの「やったー！」"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-amber-600/30 rounded-lg text-gray-900 dark:text-amber-100 placeholder-gray-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          {/* Source URL */}
          <div>
            <label
              htmlFor="request-source-url"
              className="text-sm font-medium text-gray-700 dark:text-amber-200 mb-2 block"
            >
              元配信のURL{" "}
              <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              id="request-source-url"
              type="url"
              value={requestForm.sourceUrl}
              onChange={(e) => handleInputChange("sourceUrl", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-amber-600/30 rounded-lg text-gray-900 dark:text-amber-100 placeholder-gray-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
              YouTubeなどの元配信のURLを入力してください
            </p>
          </div>

          {/* Clip URL */}
          <div>
            <label
              htmlFor="request-clip-url"
              className="text-sm font-medium text-gray-700 dark:text-amber-200 mb-2 block"
            >
              切り抜き動画のURL（任意）
            </label>
            <input
              id="request-clip-url"
              type="url"
              value={requestForm.clipUrl || ""}
              onChange={(e) => handleInputChange("clipUrl", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-amber-600/30 rounded-lg text-gray-900 dark:text-amber-100 placeholder-gray-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
              切り抜き動画がある場合は入力してください
            </p>
          </div>

          {/* X (Twitter) URL */}
          <div>
            <label
              htmlFor="request-x-url"
              className="text-sm font-medium text-gray-700 dark:text-amber-200 mb-2 block"
            >
              X（Twitter）のURL（任意）
            </label>
            <input
              id="request-x-url"
              type="url"
              value={requestForm.xUrl || ""}
              onChange={(e) => handleInputChange("xUrl", e.target.value)}
              placeholder="https://x.com/..."
              className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-amber-600/30 rounded-lg text-gray-900 dark:text-amber-100 placeholder-gray-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
              関連するXの投稿がある場合は入力してください
            </p>
          </div>

          {/* Comment */}
          <div>
            <label
              htmlFor="request-comment"
              className="text-sm font-medium text-gray-700 dark:text-amber-200 mb-2 block"
            >
              投稿者からのコメント
            </label>
            <textarea
              id="request-comment"
              value={requestForm.comment || ""}
              onChange={(e) => handleInputChange("comment", e.target.value)}
              placeholder="この音声の魅力や、どんな場面での音声なのか教えてください"
              rows={4}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-amber-600/30 rounded-lg text-gray-900 dark:text-amber-100 placeholder-gray-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-600 resize-none"
            />
            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
              このクリップの魅力を伝えてください
            </p>
          </div>

          {/* Submit button */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-amber-100 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors font-medium"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                isValid
                  ? "bg-amber-600 text-white dark:text-zinc-900 hover:bg-amber-700 dark:hover:bg-amber-500"
                  : "bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-zinc-500 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>リクエストを送信</span>
            </button>
          </div>

          <p className="text-xs text-gray-600 dark:text-zinc-500 text-center">
            ※リクエストは運営による確認後、サイトに追加されます
          </p>
        </div>
      </div>
    </div>
  );
}

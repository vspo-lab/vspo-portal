"use client";

import Link from "next/link";
import { useEffect } from "react";

interface ClipDetailErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ClipDetailError({
  error,
  reset,
}: ClipDetailErrorProps) {
  useEffect(() => {
    // Log error for monitoring
    console.error("Clip detail page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        {/* Error icon */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01"
              />
            </svg>
          </div>
        </div>

        {/* Error message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          動画の読み込みに失敗しました
        </h1>

        <p className="text-gray-600 mb-8">
          申し訳ございません。切り抜き動画の詳細情報を読み込み中にエラーが発生しました。
          動画が削除されているか、一時的にアクセスできない状態の可能性があります。
        </p>

        {/* Error details (for development) */}
        {process.env.NODE_ENV === "development" && (
          <details className="mb-8 text-left bg-gray-100 rounded-lg p-4">
            <summary className="cursor-pointer font-medium text-gray-700 mb-2">
              エラー詳細（開発用）
            </summary>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        {/* Action buttons */}
        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            再試行
          </button>

          <Link
            href="/clips"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            切り抜き動画一覧に戻る
          </Link>

          <Link
            href="/"
            className="block text-blue-600 hover:text-blue-700 transition-colors"
          >
            ホームに戻る
          </Link>
        </div>

        {/* Suggestions */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">こんな時は...</h3>
          <div className="text-sm text-gray-600 space-y-2 text-left">
            <p>• 動画が削除されている場合があります</p>
            <p>• ネットワーク接続を確認してください</p>
            <p>• ブラウザのキャッシュをクリアしてください</p>
            <p>• しばらく時間をおいてから再度お試しください</p>
          </div>
        </div>

        {/* Related links */}
        <div className="mt-8">
          <h3 className="font-medium text-gray-900 mb-4">
            他のコンテンツを見る
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/clips?sort=trending"
              className="px-4 py-2 bg-blue-50 text-blue-600 text-sm rounded-lg hover:bg-blue-100 transition-colors"
            >
              人気の動画
            </Link>
            <Link
              href="/clips?sort=latest"
              className="px-4 py-2 bg-green-50 text-green-600 text-sm rounded-lg hover:bg-green-100 transition-colors"
            >
              最新の動画
            </Link>
            <Link
              href="/vtubers"
              className="px-4 py-2 bg-purple-50 text-purple-600 text-sm rounded-lg hover:bg-purple-100 transition-colors"
            >
              VTuber一覧
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

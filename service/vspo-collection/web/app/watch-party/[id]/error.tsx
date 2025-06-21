"use client";

import Link from "next/link";
import { useEffect } from "react";

interface WatchPartyDetailErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function WatchPartyDetailError({
  error,
  reset,
}: WatchPartyDetailErrorProps) {
  useEffect(() => {
    // Log error for monitoring
    console.error("Watch party detail page error:", error);
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
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
          ウォッチパーティが見つかりません
        </h1>

        <p className="text-gray-600 mb-8">
          申し訳ございません。ウォッチパーティの読み込み中にエラーが発生しました。
          パーティが終了しているか、アクセス権限がない可能性があります。
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
            href="/watch-party"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            ウォッチパーティ一覧に戻る
          </Link>

          <Link
            href="/"
            className="block text-blue-600 hover:text-blue-700 transition-colors"
          >
            ホームに戻る
          </Link>
        </div>

        {/* Troubleshooting */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">考えられる原因</h3>
          <div className="text-sm text-gray-600 space-y-2 text-left">
            <p>• ウォッチパーティが既に終了している</p>
            <p>• 招待コードが間違っている</p>
            <p>• プライベートパーティへのアクセス権限がない</p>
            <p>• ネットワーク接続に問題がある</p>
            <p>• 一時的なサーバーエラー</p>
          </div>
        </div>

        {/* Alternative actions */}
        <div className="mt-8">
          <h3 className="font-medium text-gray-900 mb-4">他にできること</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/watch-party?status=active"
              className="px-4 py-2 bg-green-50 text-green-600 text-sm rounded-lg hover:bg-green-100 transition-colors"
            >
              🔴 開催中のパーティ
            </Link>
            <Link
              href="/clips?watchParty=true"
              className="px-4 py-2 bg-purple-50 text-purple-600 text-sm rounded-lg hover:bg-purple-100 transition-colors"
            >
              🎉 パーティ対応動画
            </Link>
            <Link
              href="/clips"
              className="px-4 py-2 bg-blue-50 text-blue-600 text-sm rounded-lg hover:bg-blue-100 transition-colors"
            >
              📺 切り抜き動画
            </Link>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 ヒント</h4>
          <p className="text-sm text-blue-700">
            招待リンクを再度確認するか、ホストに新しい招待リンクを
            <br />
            送ってもらってください。
          </p>
        </div>
      </div>
    </div>
  );
}

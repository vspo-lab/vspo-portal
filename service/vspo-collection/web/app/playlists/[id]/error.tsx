"use client";

import Link from "next/link";
import { useEffect } from "react";

interface PlaylistDetailErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PlaylistDetailError({
  error,
  reset,
}: PlaylistDetailErrorProps) {
  useEffect(() => {
    // Log error for monitoring
    console.error("Playlist detail page error:", error);
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
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
          プレイリストの読み込みに失敗しました
        </h1>

        <p className="text-gray-600 mb-8">
          申し訳ございません。プレイリストの詳細情報を読み込み中にエラーが発生しました。
          プレイリストが削除されているか、一時的にアクセスできない状態の可能性があります。
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
            href="/playlists"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            プレイリスト一覧に戻る
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
          <h3 className="font-medium text-gray-900 mb-4">考えられる原因</h3>
          <div className="text-sm text-gray-600 space-y-2 text-left">
            <p>• プレイリストが削除または非公開になっている</p>
            <p>• プライベートプレイリストへのアクセス権限がない</p>
            <p>• ネットワーク接続に問題がある</p>
            <p>• 一時的なサーバーエラー</p>
            <p>• プレイリストのデータが破損している</p>
          </div>
        </div>

        {/* Alternative suggestions */}
        <div className="mt-8">
          <h3 className="font-medium text-gray-900 mb-4">
            他のコンテンツを見る
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/playlists?sort=popular"
              className="px-4 py-2 bg-purple-50 text-purple-600 text-sm rounded-lg hover:bg-purple-100 transition-colors"
            >
              人気のプレイリスト
            </Link>
            <Link
              href="/playlists?sort=latest"
              className="px-4 py-2 bg-green-50 text-green-600 text-sm rounded-lg hover:bg-green-100 transition-colors"
            >
              最新のプレイリスト
            </Link>
            <Link
              href="/clips"
              className="px-4 py-2 bg-blue-50 text-blue-600 text-sm rounded-lg hover:bg-blue-100 transition-colors"
            >
              切り抜き動画
            </Link>
            <Link
              href="/vtubers"
              className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors"
            >
              VTuber一覧
            </Link>
          </div>
        </div>

        {/* Help section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 ヒント</h4>
          <p className="text-sm text-blue-700">
            プレイリストが見つからない場合は、作成者のページから
            <br />
            他のプレイリストを探してみてください。
          </p>
        </div>
      </div>
    </div>
  );
}

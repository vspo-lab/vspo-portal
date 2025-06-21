"use client";

import Link from "next/link";
import { useEffect } from "react";

interface VTuberDetailErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function VTuberDetailError({
  error,
  reset,
}: VTuberDetailErrorProps) {
  useEffect(() => {
    // Log error for monitoring
    console.error("VTuber detail page error:", error);
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        {/* Error message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          VTuber情報の読み込みに失敗しました
        </h1>

        <p className="text-gray-600 mb-8">
          申し訳ございません。VTuberの詳細情報を読み込み中にエラーが発生しました。
          しばらく時間をおいてから再度お試しください。
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
            href="/vtubers"
            className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            VTuber一覧に戻る
          </Link>

          <Link
            href="/"
            className="block text-blue-600 hover:text-blue-700 transition-colors"
          >
            ホームに戻る
          </Link>
        </div>

        {/* Help text */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            問題が継続する場合は、お使いのブラウザのキャッシュをクリアするか、
            <br />
            別のブラウザでお試しください。
          </p>
        </div>
      </div>
    </div>
  );
}

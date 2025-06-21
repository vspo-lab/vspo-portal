"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Host Dashboard Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center space-y-6 border border-white/20">
        {/* Error icon */}
        <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
          <span className="text-4xl">😰</span>
        </div>

        {/* Error message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            エラーが発生しました
          </h2>
          <p className="text-white/70">
            ホストダッシュボードの読み込み中に問題が発生しました
          </p>
        </div>

        {/* Error details */}
        <div className="bg-black/20 rounded-lg p-4">
          <p className="text-sm text-white/60 font-mono break-all">
            {error.message || "Unknown error occurred"}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:shadow-lg transition-all duration-300"
          >
            もう一度試す
          </button>
          <a
            href="/watch-party"
            className="flex-1 px-6 py-3 bg-white/20 text-white rounded-full font-bold hover:bg-white/30 transition-all duration-300 text-center"
          >
            一覧に戻る
          </a>
        </div>

        {/* Help text */}
        <p className="text-xs text-white/50">
          問題が続く場合は、サポートまでお問い合わせください
        </p>
      </div>
    </div>
  );
}
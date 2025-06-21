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
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            切り抜きの読み込みに失敗しました
          </h2>
          <p className="text-gray-600 mb-6">
            切り抜きデータの取得中にエラーが発生しました。もう一度お試しください。
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            再試行
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            ホームに戻る
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          問題が続く場合は、しばらく時間をおいてから再度お試しください。
        </p>
      </div>
    </div>
  );
}

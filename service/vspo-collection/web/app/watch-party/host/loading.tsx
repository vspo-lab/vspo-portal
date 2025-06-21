export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Animated loader */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse" />
          <div className="absolute inset-2 bg-gradient-to-br from-purple-900 via-pink-900 to-blue-900 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl animate-bounce">🎬</span>
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            ホストダッシュボードを準備中...
          </h2>
          <p className="text-white/70">
            もうすぐウォッチパーティーを開始できます
          </p>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
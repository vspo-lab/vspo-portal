export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          コンテンツを読み込み中...
        </h2>
        <p className="text-gray-500">
          最新の切り抜きとプレイリストを準備しています
        </p>
      </div>
    </div>
  );
}

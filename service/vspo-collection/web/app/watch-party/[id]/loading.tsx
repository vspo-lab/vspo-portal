export default function WatchPartyDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-6 bg-red-200 rounded-full w-20 animate-pulse" />
        </div>
        <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse" />
      </div>

      {/* Watch party info skeleton */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-64 animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main video area */}
        <div className="lg:col-span-2">
          {/* Video player skeleton */}
          <div className="aspect-video bg-gray-200 rounded-lg animate-pulse mb-6" />

          {/* Video controls skeleton */}
          <div className="bg-white rounded-lg p-4 shadow-md mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 h-2 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          </div>

          {/* Reactions section skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md mb-6">
            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse mb-4" />
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Video info skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-3" />
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse mb-4" />

            <div className="flex gap-6 text-sm">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-200 rounded w-20 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Participants skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="h-5 bg-gray-200 rounded w-16 animate-pulse mb-4" />

            {/* Chat messages skeleton */}
            <div className="space-y-3 mb-4 max-h-64 overflow-hidden">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse mb-1" />
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {/* Chat input skeleton */}
            <div className="flex gap-2">
              <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Related content skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-16 h-12 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements skeleton */}
      <div className="fixed bottom-4 right-4 space-y-2">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-64 h-20 bg-white rounded-lg shadow-lg animate-pulse" />
      </div>
    </div>
  );
}

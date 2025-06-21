export default function PlaylistDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        <span>/</span>
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        <span>/</span>
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Playlist header skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md mb-6">
            <div className="flex gap-6">
              <div className="w-48 h-32 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex gap-3 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Current video player skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md mb-6">
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-4" />
            <div className="aspect-video bg-gray-200 rounded-lg animate-pulse mb-4" />
            <div className="h-6 bg-gray-200 rounded w-full animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse mb-4" />

            {/* Video controls skeleton */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 h-2 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          </div>

          {/* Playlist videos skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
            </div>

            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center animate-pulse" />
                  <div className="w-24 h-16 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                  </div>
                  <div className="w-10 h-6 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creator info skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse mb-4" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
          </div>

          {/* Stats skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="h-5 bg-gray-200 rounded w-16 animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-6 bg-gray-200 rounded w-12 mx-auto animate-pulse mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-16 mx-auto animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Related playlists skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-16 h-12 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="h-5 bg-gray-200 rounded w-20 animate-pulse mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-1" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

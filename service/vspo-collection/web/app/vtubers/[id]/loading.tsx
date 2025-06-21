export default function VTuberDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Avatar skeleton */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 md:w-48 md:h-48 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* Info skeleton */}
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          </div>

          {/* Stats skeleton */}
          <div className="flex gap-6 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse mb-1" />
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"
          />
        ))}
      </div>

      {/* Navigation tabs skeleton */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-200 rounded w-20 animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
          >
            {/* Thumbnail skeleton */}
            <div className="aspect-video bg-gray-200" />

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="flex justify-between items-center">
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-3 bg-gray-200 rounded w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar skeleton (for larger screens) */}
      <div className="hidden xl:block fixed right-4 top-1/4 w-64 space-y-4">
        <div className="bg-white rounded-lg p-4 shadow-md">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-8 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-full animate-pulse mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

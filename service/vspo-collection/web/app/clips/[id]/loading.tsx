export default function ClipDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
        <span>/</span>
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
        <span>/</span>
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Video player skeleton */}
          <div className="aspect-video bg-gray-200 rounded-lg animate-pulse mb-6" />

          {/* Title and info skeleton */}
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-full animate-pulse mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mb-4" />

            {/* Stats skeleton */}
            <div className="flex items-center gap-6 mb-4">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            </div>

            {/* Action buttons skeleton */}
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* VTuber info skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
              <div className="h-10 bg-gray-200 rounded-lg w-20 animate-pulse" />
            </div>
          </div>

          {/* Description skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md mb-6">
            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related clips */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-20 h-14 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending clips */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="h-5 bg-gray-200 rounded w-28 animate-pulse mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-20 h-14 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Watch party skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="h-5 bg-gray-200 rounded w-36 animate-pulse mb-4" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
              <div className="h-10 bg-gray-200 rounded w-full animate-pulse mt-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

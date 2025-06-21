export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded-lg w-48 mb-4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-72 animate-pulse" />
        </div>

        {/* Filter skeleton */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4 flex-wrap">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"
              />
            ))}
          </div>
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded-lg w-80 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md p-6 animate-pulse"
            >
              <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 bg-gray-200 rounded-full mb-3" />
                <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-200 rounded w-20" />
                <div className="h-3 bg-gray-200 rounded w-28" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded w-8" />
                <div className="h-8 bg-gray-200 rounded w-8" />
                <div className="h-8 bg-gray-200 rounded w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

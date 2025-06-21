export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded-lg w-48 mb-4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
        </div>

        {/* Filter skeleton */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-lg w-28 animate-pulse" />
          </div>
          <div className="h-10 bg-gray-200 rounded-lg w-80 animate-pulse" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

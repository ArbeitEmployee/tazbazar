export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image skeleton */}
          <div className="space-y-4">
            <div className="aspect-square w-full animate-pulse rounded-2xl bg-gray-100" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 w-16 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          </div>
          {/* Info skeleton */}
          <div className="space-y-4 pt-2">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-3/4 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-px w-full bg-gray-100 my-4" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100 mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

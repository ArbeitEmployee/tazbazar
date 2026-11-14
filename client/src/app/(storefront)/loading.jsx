// Shared loading skeleton for every storefront route.
// Without this, App Router keeps showing the previous page while the next
// route's client bundle and data are loading, which makes navigation look
// frozen (URL changes but the page does not).
export default function StorefrontLoading() {
  return (
    <div className="min-h-[60vh] w-full bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 h-8 w-56 animate-pulse rounded-lg bg-gray-100" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-square w-full animate-pulse rounded-2xl bg-gray-100" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

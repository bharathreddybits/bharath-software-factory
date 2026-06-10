export default function DashboardLoading() {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Sidebar skeleton */}
      <div className="flex h-screen w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-4">
        <div className="mb-4 px-1">
          <div className="h-8 w-full animate-pulse rounded-lg bg-zinc-800" />
        </div>
        <div className="flex-1 space-y-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-zinc-800/60" />
          ))}
        </div>
        <div className="mt-auto border-t border-zinc-800 pt-3 px-1">
          <div className="h-3 w-32 animate-pulse rounded bg-zinc-800" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl space-y-8">
          <div className="space-y-2">
            <div className="h-7 w-52 animate-pulse rounded-lg bg-zinc-800" />
            <div className="h-4 w-72 animate-pulse rounded bg-zinc-800/60" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

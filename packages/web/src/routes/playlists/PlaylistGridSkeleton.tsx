export default function PlaylistGridSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
      {/* Header row — mirrors PlaylistGrid's header */}
      <div className="flex items-baseline justify-between mb-6">
        <div className="h-6 w-32 rounded-md bg-surface-raised animate-pulse" />
        <div className="h-4 w-16 rounded bg-surface-raised animate-pulse" />
      </div>

      {/* Grid — same column setup as PlaylistGrid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: index used as placeholder
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

const SkeletonCard = () => (
  <div className="flex flex-col rounded-xl overflow-hidden bg-surface-raised border border-border">
    {/* Thumbnail placeholder — matches aspect-video */}
    <div className="aspect-video w-full bg-surface-hover animate-pulse" />

    {/* Info placeholder */}
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="h-4 w-full rounded bg-surface-hover animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-surface-hover animate-pulse" />
      <div className="h-3 w-16 rounded bg-surface-hover animate-pulse mt-1" />
    </div>
  </div>
)

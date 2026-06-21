export default function VideoListSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
      {/* Header row — mirrors VideoList's header */}
      <div className="flex items-baseline justify-between mb-6">
        <div className="h-6 w-24 rounded-md bg-surface-raised animate-pulse" />
        <div className="h-4 w-16 rounded bg-surface-raised animate-pulse" />
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: index used as placeholder
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}

const SkeletonRow = () => (
  <div className="flex items-center gap-4 rounded-lg p-2 bg-surface-raised border border-border">
    {/* Thumbnail placeholder — same w-40 aspect-video as VideoRow */}
    <div className="shrink-0 w-40 aspect-video rounded-md bg-surface-hover animate-pulse" />

    {/* Text placeholders */}
    <div className="flex flex-col gap-2 min-w-0 flex-1 pr-2">
      <div className="h-4 w-3/4 rounded bg-surface-hover animate-pulse" />
      <div className="h-3 w-1/3 rounded bg-surface-hover animate-pulse" />
    </div>
  </div>
)

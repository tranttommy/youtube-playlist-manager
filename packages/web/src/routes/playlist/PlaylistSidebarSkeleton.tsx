// routes/playlist/PlaylistSidebarSkeleton.tsx
export default function PlaylistSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-video w-full rounded-xl bg-surface-raised animate-pulse" />
      <div className="flex flex-col gap-2">
        <div className="h-5 w-3/4 rounded bg-surface-raised animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-surface-raised animate-pulse" />
      </div>
    </div>
  )
}

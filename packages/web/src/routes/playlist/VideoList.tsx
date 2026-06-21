import type { PlaylistItem } from '@ypm/shared'
import VideoRow from './VideoRow'

export default function VideoList({ items }: { items: PlaylistItem[] }) {
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
      {/* Header row */}
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-text-primary tracking-tight">
          Videos
        </h2>
        <span className="text-xs text-text-muted">
          {items.length} {items.length === 1 ? 'video' : 'videos'}
        </span>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {items.map(item => (
          <VideoRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

// routes/playlist/VideoRow.tsx
import type { PlaylistItem } from '@ypm/shared'
import NoThumbnailIcon from '../../components/NoThumbnailIcon'

export default function VideoRow({ item }: { item: PlaylistItem }) {
  return (
    <div className="group flex items-center gap-4 rounded-lg p-2 bg-surface-raised hover:bg-surface-hover border border-border hover:border-border/80 transition-all duration-200">
      {/* Thumbnail */}
      <div className="relative shrink-0 w-40 aspect-video rounded-md overflow-hidden bg-surface">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={`${item.title} thumbnail`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <NoThumbnailIcon />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 min-w-0 pr-2">
        <h3 className="text-sm font-medium text-text-primary leading-snug line-clamp-2 group-hover:text-white transition-colors duration-200">
          {item.title}
        </h3>
        <span className="text-xs text-text-muted truncate">
          {item.channel_title ?? 'Unknown channel'}
        </span>
      </div>
    </div>
  )
}

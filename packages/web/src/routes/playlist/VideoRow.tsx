// routes/playlist/VideoRow.tsx
import type { PlaylistItem } from '@ypm/shared'

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

const NoThumbnailIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-text-muted"
  >
    <title>No thumbnail</title>
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="2" y1="7" x2="7" y2="7" />
    <line x1="2" y1="17" x2="7" y2="17" />
    <line x1="17" y1="7" x2="22" y2="7" />
    <line x1="17" y1="17" x2="22" y2="17" />
  </svg>
)

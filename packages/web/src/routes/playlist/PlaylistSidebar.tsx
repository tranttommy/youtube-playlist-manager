// routes/playlist/PlaylistSidebar.tsx
import type { Playlist } from '@ypm/shared'
import NoThumbnailIcon from '../../components/NoThumbnailIcon'
import PullIcon from '../../components/PullIcon'

export default function PlaylistSidebar({
  playlist,
  onSync,
  isSyncing,
  isQuotaExhausted
}: {
  playlist: Playlist
  onSync: () => void
  isSyncing: boolean
  isQuotaExhausted: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Thumbnail */}
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-surface-raised">
        {playlist.thumbnail ? (
          <img
            src={playlist.thumbnail}
            alt={`${playlist.title} thumbnail`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <NoThumbnailIcon size={40} />
          </div>
        )}
      </div>

      {/* Title + count */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-display font-semibold text-text-primary tracking-tight leading-snug">
          {playlist.title}
        </h1>
        <span className="text-xs text-text-muted">
          {playlist.item_count} {playlist.item_count === 1 ? 'video' : 'videos'}
        </span>
      </div>

      {/* Re-sync */}
      <button
        type="button"
        onClick={onSync}
        disabled={isSyncing || isQuotaExhausted}
        className="mt-1 inline-flex items-center justify-center gap-2 bg-surface-raised hover:bg-surface-hover border border-border text-text-secondary hover:text-text-primary text-sm font-medium px-4 py-2.5 rounded-lg transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface-raised disabled:hover:text-text-secondary"
      >
        <PullIcon />
        {isSyncing ? 'Syncing...' : 'Re-sync videos'}
      </button>
    </div>
  )
}

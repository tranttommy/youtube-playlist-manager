import type { Playlist } from '@ypm/shared'
import PullIcon from '../../components/PullIcon'
import PlaylistCard from './PlaylistCard'

export default function PlaylistGrid({
  playlists,
  onSync,
  isSyncing,
  isQuotaExhausted
}: {
  playlists: Playlist[]
  onSync: () => void
  isSyncing: boolean
  isQuotaExhausted: boolean
}) {
  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-display font-semibold text-text-primary tracking-tight">
          My Playlists
        </h2>

        <div className="flex items-center gap-4">
          <span className="text-xs text-text-muted">
            {playlists.length}{' '}
            {playlists.length === 1 ? 'playlist' : 'playlists'}
          </span>
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing || isQuotaExhausted}
            className="inline-flex items-center gap-2 bg-surface-raised border border-border text-text-secondary text-xs font-medium px-3 py-2 rounded-lg transition-colors duration-200 enabled:hover:bg-surface-hover enabled:hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <PullIcon />
            {isSyncing ? 'Syncing...' : 'Re-sync'}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {playlists.map(playlist => (
          <PlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </div>
    </div>
  )
}

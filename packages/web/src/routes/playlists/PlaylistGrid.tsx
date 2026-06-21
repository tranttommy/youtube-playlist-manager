import type { Playlist } from '@ypm/shared'
import PlaylistCard from './PlaylistCard'

export default function PlaylistGrid({ playlists }: { playlists: Playlist[] }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
      {/* Header row */}
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-text-primary tracking-tight">
          My Playlists
        </h2>
        <span className="text-xs text-text-muted">
          {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
        </span>
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

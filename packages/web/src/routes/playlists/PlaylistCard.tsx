import type { Playlist } from '@ypm/shared'
import { Link } from 'react-router'
import NoThumbnailIcon from '../../components/NoThumbnailIcon'

export default function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link
      to={`playlist/${playlist.id}`}
      className="group flex flex-col text-left rounded-xl overflow-hidden bg-surface-raised hover:bg-surface-hover border border-border hover:border-border/80 transition-all duration-200 cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-surface overflow-hidden">
        {playlist.thumbnail ? (
          <img
            src={playlist.thumbnail}
            alt={`${playlist.title} Thumbnail`}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <NoThumbnailIcon />
          </div>
        )}

        {/* Video count badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/75 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-md">
          <VideoCountIcon />
          <span>{playlist.item_count}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 px-4 py-3">
        <h3 className="text-sm font-medium text-text-primary leading-snug line-clamp-2 group-hover:text-white transition-colors duration-200">
          {playlist.title}
        </h3>
        <span className="text-xs text-text-muted">
          {playlist.item_count} {playlist.item_count === 1 ? 'video' : 'videos'}
        </span>
      </div>
    </Link>
  )
}

const VideoCountIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <title>Videos</title>
    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
  </svg>
)

import type { PlaylistItem } from '@ypm/shared'
import Checkbox from '../../components/Checkbox'
import NoThumbnailIcon from '../../components/NoThumbnailIcon'

export default function VideoRow({
  video,
  isSelected,
  onToggle
}: {
  video: PlaylistItem
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: to make the whole component clickable for UX
    // biome-ignore lint/a11y/useKeyWithClickEvents: to make the whole component clickable for UX
    <div
      className={`group flex items-center gap-4 rounded-lg p-2 border transition-all duration-200 ${
        isSelected
          ? 'bg-accent-soft border-accent/50'
          : 'bg-surface-raised hover:bg-surface-hover border-border hover:border-border/80'
      }`}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onChange={onToggle}
        label={`Select ${video.title}`}
      >
        {/* Thumbnail */}
        <div className="relative shrink-0 w-40 aspect-video rounded-md overflow-hidden bg-surface">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={`${video.title} thumbnail`}
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
            {video.title}
          </h3>
          <span className="text-xs text-text-muted truncate">
            {video.channel_title ?? 'Unknown channel'}
          </span>
        </div>
      </Checkbox>
    </div>
  )
}

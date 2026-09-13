import type { PlaylistItem } from '@ypm/shared'
import Checkbox from '../../components/Checkbox'
import VideoRow from './VideoRow'

export default function VideoList({
  videos,
  selectedIds,
  setSelectedIds
}: {
  videos: PlaylistItem[]
  selectedIds: Set<string>
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>
}) {
  const selectedCount = selectedIds.size
  const isAllSelected = videos.length > 0 && selectedCount === videos.length

  const onToggle = (videoId: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(videoId) ? next.delete(videoId) : next.add(videoId)
      return next
    })

  const onClear = () => setSelectedIds(new Set())

  const onSelectAllToggle = () =>
    !isAllSelected ? setSelectedIds(new Set(videos.map(v => v.id))) : onClear()

  return (
    <div>
      {/* Title row */}
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <h2 className="text-lg font-display font-semibold text-text-primary tracking-tight">
          Videos
        </h2>
        <span className="text-xs text-text-muted">
          {videos.length} {videos.length === 1 ? 'video' : 'videos'}
        </span>
      </div>

      {/* Selection toolbar */}
      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border">
        <div className="pl-1 flex items-center">
          <Checkbox
            checked={isAllSelected}
            onChange={onSelectAllToggle}
            label="Select all videos"
          >
            Select all
          </Checkbox>
        </div>

        <div
          className={`flex items-center gap-3 ml-auto ${
            selectedCount > 0 ? '' : 'invisible'
          }`}
        >
          <span className="text-xs text-accent font-medium">
            {selectedCount} selected
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-text-secondary hover:text-text-primary border border-border hover:border-text-muted rounded-md px-2.5 py-1.5 transition-colors duration-200"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {videos.map(video => (
          <VideoRow
            key={video.id}
            video={video}
            isSelected={selectedIds.has(video.id)}
            onToggle={() => onToggle(video.id)}
          />
        ))}
      </div>
    </div>
  )
}

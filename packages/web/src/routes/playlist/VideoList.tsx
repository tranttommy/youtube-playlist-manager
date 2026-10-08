import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Playlist, PlaylistItem } from '@ypm/shared'
import { useState } from 'react'
import { toast } from 'sonner'
import Checkbox from '../../components/Checkbox'
import ProgressBar from '../../components/ProgressBar'
import { streamSync } from '../../lib/request'
import VideoRow from './VideoRow'

type Operation = 'move' | 'delete'

export default function VideoList({
  videos,
  playlistId,
  playlists,
  queryKey,
  isQuotaExhausted
}: {
  videos: PlaylistItem[]
  playlistId?: string
  playlists: Playlist[]
  queryKey: (string | undefined)[]
  isQuotaExhausted: boolean
}) {
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const selectedCount = selectedIds.size
  const isAllSelected = videos.length > 0 && selectedCount === videos.length

  const handleToggle = (videoId: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(videoId) ? next.delete(videoId) : next.add(videoId)
      return next
    })

  const handleSelectAllToggle = () =>
    !isAllSelected
      ? setSelectedIds(new Set(videos.map(v => v.id))) // select all
      : setSelectedIds(new Set()) // unselect all

  const [targetPlaylistId, setTargetPlaylistId] = useState('')

  const [progress, setProgress] = useState<{
    processed: number
    total: number
  } | null>(null)

  const mutation = useMutation({
    mutationFn: (operation: Operation) =>
      streamSync<{
        succeeded: number
        failed: number
      }>(`/api/youtube/${operation}/${playlistId}`, setProgress, {
        selectedIds: [...selectedIds],
        targetPlaylistId
      }),
    onSuccess: result => {
      setSelectedIds(new Set())
      setTargetPlaylistId('')
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
      queryClient.invalidateQueries({ queryKey: ['quota'] })

      if (result.failed) {
        toast.warning(
          `Processed ${result.succeeded} videos, ${result.failed} failed`
        )
      } else {
        toast.success(`Processed ${result.succeeded ?? 0} videos`)
      }
    },
    onSettled: () => setProgress(null)
  })

  const handleCut = (operation: Operation) =>
    confirm(
      `${operation === 'move' ? 'M' : 'Rem'}ove ${selectedCount} videos from this playlist? This cannot be undone.`
    ) && mutation.mutate(operation)

  return (
    <div>
      <div className="sticky top-16 z-10 bg-surface -mt-8 pt-8 pb-3 mb-6 border-b border-border">
        {/* Subheader */}
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <h2 className="text-lg font-display font-semibold text-text-primary tracking-tight">
            Videos
          </h2>
          <span className="text-xs text-text-muted">
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </span>
        </div>

        {/* Selection Toolbar */}
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isAllSelected}
            onChange={handleSelectAllToggle}
            label="Select all videos"
          >
            <span className="text-xs text-text-secondary">Select all</span>
          </Checkbox>
          <div
            className={`flex items-center gap-2 ml-auto ${
              selectedCount > 0 ? '' : 'invisible'
            }`}
          >
            {mutation.isPending && progress ? (
              <div className="w-64">
                <ProgressBar
                  processed={progress.processed}
                  total={progress.total}
                  label={'Processing'}
                />
              </div>
            ) : (
              <>
                <span className="text-xs text-accent font-medium mr-1">
                  {selectedCount} selected
                </span>
                <select
                  value={targetPlaylistId}
                  onChange={e => setTargetPlaylistId(e.target.value)}
                  aria-label="Move to playlist"
                  className="bg-surface-raised border border-border rounded-md px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-text-muted cursor-pointer max-w-40"
                >
                  <option value="">Move to...</option>
                  {playlists.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!targetPlaylistId || isQuotaExhausted}
                  onClick={() => handleCut('move')}
                  className="text-xs text-text-secondary border border-border rounded-md px-2.5 py-1.5 transition-colors duration-200 enabled:hover:text-text-primary enabled:hover:border-text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Move
                </button>
                <button
                  type="button"
                  disabled={isQuotaExhausted}
                  onClick={() => handleCut('delete')}
                  className="text-xs text-accent border border-accent/50 rounded-md px-2.5 py-1.5 transition-colors duration-200 enabled:hover:text-white enabled:hover:bg-accent enabled:hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Video List */}
      <div className="flex flex-col gap-2">
        {videos.map(video => (
          <VideoRow
            key={video.id}
            video={video}
            isSelected={selectedIds.has(video.id)}
            onToggle={() => handleToggle(video.id)}
          />
        ))}
      </div>
    </div>
  )
}

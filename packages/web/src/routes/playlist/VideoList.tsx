import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Playlist, PlaylistItem } from '@ypm/shared'
import { useState } from 'react'
import { toast } from 'sonner'
import Checkbox from '../../components/Checkbox'
import ProgressBar from '../../components/ProgressBar'
import { streamSync } from '../../lib/request'
import VideoRow from './VideoRow'

export default function VideoList({
  videos,
  playlistId,
  playlists,
  queryKey
}: {
  videos: PlaylistItem[]
  playlistId?: string
  playlists: Playlist[]
  queryKey: (string | undefined)[]
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

  const [targetPlaylist, setTargetPlaylist] = useState('')

  const [deleteProgress, setDeleteProgress] = useState<{
    processed: number
    total: number
  } | null>(null)

  const deleteMutation = useMutation({
    mutationFn: () => {
      let result: {
        deleted: number
        failed: number
        isQuotaHit: boolean
      } | null = null
      return streamSync<typeof result>(
        `/api/youtube/delete/${playlistId}`,
        event => {
          if (event.event === 'progress') setDeleteProgress(event.data)
          else if (event.event === 'done') result = event.data
          else if (event.event === 'error') throw new Error(event.data.message)
        },
        [...selectedIds]
      ).then(() => result)
    },
    onSuccess: result => {
      setSelectedIds(new Set())
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['playlists'] })

      if (result?.isQuotaHit) {
        toast.error(
          `Deleted ${result.deleted} videos — daily quota exhausted. Resets at midnight Pacific.`
        )
      } else if (result?.failed) {
        toast.warning(
          `Deleted ${result.deleted} videos, ${result.failed} failed`
        )
      } else {
        toast.success(`Deleted ${result?.deleted ?? 0} videos`)
      }
    },
    onSettled: () => setDeleteProgress(null)
  })

  const onMove = (target: string) => console.log({ target })

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
            {deleteMutation.isPending && deleteProgress ? (
              <div className="w-64">
                <ProgressBar
                  processed={deleteProgress.processed}
                  total={deleteProgress.total}
                  label="Deleting"
                />
              </div>
            ) : (
              <>
                <span className="text-xs text-accent font-medium mr-1">
                  {selectedCount} selected
                </span>
                <select
                  value={targetPlaylist}
                  onChange={e => setTargetPlaylist(e.target.value)}
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
                  disabled={!targetPlaylist}
                  onClick={() => onMove(targetPlaylist)}
                  className="text-xs text-text-secondary hover:text-text-primary border border-border hover:border-text-muted rounded-md px-2.5 py-1.5 transition-colors duration-200 disabled:opacity-40 disabled:hover:text-text-secondary disabled:hover:border-border"
                >
                  Move
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate()}
                  className="text-xs text-accent hover:text-white hover:bg-accent border border-accent/50 hover:border-accent rounded-md px-2.5 py-1.5 transition-colors duration-200"
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

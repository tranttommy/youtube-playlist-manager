import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Playlist, PlaylistItem } from '@ypm/shared'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import ProgressBar from '../../components/ProgressBar'
import PullIcon from '../../components/PullIcon'
import { NO_CHANNEL } from '../../lib/constants'
import { request, streamSync } from '../../lib/request'
import ChannelFilter from './ChannelFilter'
import PlaylistSidebar from './PlaylistSidebar'
import PlaylistSidebarSkeleton from './PlaylistSidebarSkeleton'
import VideoList from './VideoList'
import VideoListSkeleton from './VideoListSkeleton'

export default function PlaylistDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const queryKey = ['playlist-detail', id]

  // playlist metadata — read from the playlists cache
  const { data: playlists = [] } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => request<Playlist[]>('/api/playlists')
  })
  const playlist = playlists.find(playlist => playlist.id === id)

  // the items
  const { data: videos = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => request<PlaylistItem[]>(`/api/playlists/${id}/items`)
  })

  const [progress, setProgress] = useState<{
    processed: number
    total: number
  } | null>(null)

  const syncMutation = useMutation({
    mutationFn: () =>
      streamSync<{ succeeded: number }>(`/api/youtube/pull/${id}`, setProgress),
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['playlists'] })
      toast.success(`Synced ${result.succeeded} videos`)
    },
    onSettled: () => setProgress(null)
  })

  const [channelFilter, setChannelFilter] = useState<string>('')

  // the filtered view handed to VideoList
  const filteredVideos = useMemo(
    () =>
      !channelFilter
        ? videos
        : channelFilter === NO_CHANNEL
          ? videos.filter(video => !video.channel_id)
          : videos.filter(video => video.channel_id === channelFilter),
    [videos, channelFilter]
  )

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="md:w-80 shrink-0">
        <div className="md:sticky md:top-24 flex flex-col gap-6">
          {playlist ? (
            <>
              <PlaylistSidebar
                playlist={playlist}
                onSync={() => syncMutation.mutate()}
                isSyncing={syncMutation.isPending}
              />
              <ChannelFilter
                videos={videos}
                value={channelFilter}
                onChange={channel => setChannelFilter(channel)}
              />
            </>
          ) : (
            <PlaylistSidebarSkeleton />
          )}
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <VideoListSkeleton />
        ) : videos.length ? (
          <VideoList
            key={channelFilter}
            videos={filteredVideos}
            playlistId={id}
            playlists={playlists.filter(p => p.id !== playlist?.id)} // remove current playlist from options
            queryKey={queryKey}
          />
        ) : (
          <div className="flex flex-col items-center text-center pt-12">
            <VideoIcon />
            <h2 className="mt-8 text-xl font-display font-semibold text-text-primary tracking-tight">
              No videos synced yet
            </h2>
            <p className="mt-3 text-text-secondary text-sm max-w-sm leading-relaxed">
              Pull this playlist's videos to view, search, and manage them here.
            </p>
            {syncMutation.isPending && progress ? (
              <ProgressBar
                processed={progress.processed}
                total={progress.total}
                label="Syncing videos"
              />
            ) : (
              <button
                type="button"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="mt-10 inline-flex items-center gap-2.5 bg-accent hover:bg-accent/85 text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors duration-200"
              >
                <PullIcon />
                {syncMutation.isPending ? 'Pulling...' : 'Pull Videos'}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

const VideoIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-text-muted"
  >
    <title>Video Icon</title>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="m10 8 6 4-6 4Z" />
  </svg>
)

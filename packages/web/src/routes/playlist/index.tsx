import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PlaylistItem } from '@ypm/shared'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import PullIcon from '../../components/PullIcon'
import { request } from '../../lib/request'
import VideoList from './VideoList'
import VideoListSkeleton from './VideoListSkeleton'

export default function PlaylistDetail() {
  const { id } = useParams()
  const queryKey = ['playlist-detail', id]
  const queryClient = useQueryClient()
  const { data: playlistItems, isLoading } = useQuery({
    queryKey,
    queryFn: () => request<PlaylistItem[]>(`/api/playlists/${id}`)
  })

  const mutation = useMutation({
    mutationFn: () =>
      request<{ playlistItemsSynced: number }>(`/api/sync/pull/${id}`, {
        method: 'POST'
      }),
    onSuccess: ({ playlistItemsSynced }) => {
      queryClient.invalidateQueries({ queryKey })
      toast.success(`Synced ${playlistItemsSynced} playlist items`)
    }
  })

  return (
    <main
      className={`flex-1 flex px-8 ${isLoading || playlistItems?.length ? 'items-start' : 'items-center justify-center'}`}
    >
      {isLoading ? (
        <VideoListSkeleton />
      ) : playlistItems?.length ? (
        <VideoList items={playlistItems} />
      ) : (
        <div className="flex flex-col items-center text-center">
          <VideoIcon />
          <h2 className="mt-8 text-xl font-display font-semibold text-text-primary tracking-tight">
            No videos synced yet
          </h2>
          <p className="mt-3 text-text-secondary text-sm max-w-sm leading-relaxed">
            Pull this playlist's videos to view, search, and manage them here.
          </p>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="mt-10 inline-flex items-center gap-2.5 bg-accent hover:bg-accent/85 text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors duration-200"
          >
            <PullIcon />
            {mutation.isPending ? 'Pulling...' : 'Pull Videos'}
          </button>
        </div>
      )}
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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Playlist, UserProfile } from '@ypm/shared'
import PlaylistGrid from './PlaylistGrid'
import PlaylistGridSkeleton from './PlaylistGridSkeleton'

export default function Dashboard({ user }: { user: UserProfile }) {
  const queryClient = useQueryClient()
  const { data: playlists, isLoading } = useQuery<Playlist[]>({
    queryKey: ['playlists'],
    queryFn: async () => (await fetch('/api/playlists')).json()
  })

  const mutation = useMutation({
    mutationFn: async () =>
      (await fetch('/api/sync/pull', { method: 'POST' })).json(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlists'] })
  })

  return (
    <div className="flex flex-col min-h-svh bg-surface">
      <Header user={user} />
      <main
        className={`flex-1 flex px-8 ${isLoading || playlists?.length ? 'items-start' : 'items-center justify-center'}`}
      >
        {isLoading ? (
          <PlaylistGridSkeleton />
        ) : playlists?.length ? (
          <PlaylistGrid playlists={playlists} />
        ) : (
          <div className="flex flex-col items-center text-center">
            <PlaylistIcon />
            <h2 className="mt-8 text-xl font-display font-semibold text-text-primary tracking-tight">
              No playlists yet
            </h2>
            <p className="mt-3 text-text-secondary text-sm max-w-sm leading-relaxed">
              Pull your YouTube playlists to start searching, organizing, and
              managing your videos.
            </p>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="mt-10 inline-flex items-center gap-2.5 bg-accent hover:bg-accent/85 text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors duration-200"
            >
              <PullIcon />
              {mutation.isPending ? 'Pulling...' : 'Pull Playlists'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

const Header = ({ user }: { user: UserProfile }) => (
  <header className="flex items-center justify-between px-8 py-5 border-b border-border">
    <div className="flex items-center gap-3">
      <Logo />
      <span className="text-sm font-bold text-text-primary tracking-tight">
        YouTube Playlist Manager
      </span>
    </div>
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-3">
        {user.picture && (
          <img
            src={user.picture}
            alt=""
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full ring-1 ring-border"
          />
        )}
        <span className="text-sm text-text-secondary">{user.name}</span>
      </div>
      <div className="w-px h-4 bg-border" />
      <a
        href="/auth/logout"
        className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-200"
      >
        Sign out
      </a>
    </div>
  </header>
)

const Logo = () => (
  <svg width="16" height="16" viewBox="0 0 32 32" className="text-accent">
    <title>YPM Logo</title>
    <circle cx="16" cy="16" r="12" fill="currentColor" />
  </svg>
)

const PullIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <title>Pull Icon</title>
    <path d="M12 3v12" />
    <path d="m8 11 4 4 4-4" />
    <path d="M8 21h8" />
  </svg>
)

const PlaylistIcon = () => (
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
    <title>Playlist Icon</title>
    <path d="M21 15V6" />
    <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path d="M12 12H3" />
    <path d="M16 6H3" />
    <path d="M12 18H3" />
  </svg>
)

import type { UserProfile } from '@ypm/shared'

const Logo = () => (
  <svg width="16" height="16" viewBox="0 0 32 32" className="text-accent">
    <title>YPM Logo</title>
    <circle cx="16" cy="16" r="12" fill="currentColor" />
  </svg>
)

export default function Dashboard({ user }: { user: UserProfile }) {
  return (
    <div className="flex flex-col min-h-svh bg-surface">
      {/* Header */}
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

      {/* Main content — placeholder */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-display font-semibold text-text-primary tracking-tight">
            Welcome, {user.name}
          </h1>
          <p className="text-text-secondary text-sm">
            Sync engine coming soon.
          </p>
        </div>
      </main>
    </div>
  )
}

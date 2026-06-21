import type { UserProfile } from '@ypm/shared'
import { Link } from 'react-router'

export default function Header({ user }: { user: UserProfile }) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-border">
      <Link to="/" className="flex items-center gap-3">
        <Logo />
        <span className="text-sm font-bold text-text-primary tracking-tight">
          YouTube Playlist Manager
        </span>
      </Link>
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
}

const Logo = () => (
  <svg width="16" height="16" viewBox="0 0 32 32" className="text-accent">
    <title>YPM Logo</title>
    <circle cx="16" cy="16" r="12" fill="currentColor" />
  </svg>
)

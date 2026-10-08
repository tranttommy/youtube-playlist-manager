import type { UserProfile } from '@ypm/shared'
import { Outlet } from 'react-router'
import Header from '../components/Header'
import { useQuota } from '../lib/hooks'

export default function Layout({ user }: { user: UserProfile }) {
  const { isQuotaExhausted } = useQuota()

  return (
    <div className="flex-1 flex flex-col">
      {isQuotaExhausted && (
        <div className="bg-accent-soft border-b border-accent/40 px-8 py-2.5 text-xs text-accent text-center">
          Daily YouTube quota reached. Syncing and editing are paused until
          midnight Pacific.
        </div>
      )}
      <Header user={user} />
      <Outlet />
    </div>
  )
}

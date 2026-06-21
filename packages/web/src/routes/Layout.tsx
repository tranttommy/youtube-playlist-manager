import type { UserProfile } from '@ypm/shared'
import { Outlet } from 'react-router'
import Header from '../components/Header'

export default function Layout({ user }: { user: UserProfile }) {
  return (
    <div className="flex-1 flex flex-col">
      <Header user={user} />
      <Outlet />
    </div>
  )
}

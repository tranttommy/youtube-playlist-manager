import { useQuery } from '@tanstack/react-query'
import type { UserProfile } from '@ypm/shared'
import { request } from './lib/request'
import Dashboard from './views/Dashboard'
import Landing from './views/Landing'
import Loading from './views/Loading'

export default function App() {
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => request<UserProfile | null>('/auth/me')
  })

  return isLoading ? <Loading /> : me ? <Dashboard user={me} /> : <Landing />
}

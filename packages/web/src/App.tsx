import { useQuery } from '@tanstack/react-query'
import type { UserProfile } from '@ypm/shared'
import Dashboard from './views/Dashboard'
import Landing from './views/Landing'
import Loading from './views/Loading'

export default function App() {
  const { data: me, isLoading } = useQuery<UserProfile | null>({
    queryKey: ['me'],
    queryFn: async () => (await fetch('/auth/me')).json()
  })

  return isLoading ? <Loading /> : me ? <Dashboard user={me} /> : <Landing />
}

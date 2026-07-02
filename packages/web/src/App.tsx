import { useQuery } from '@tanstack/react-query'
import type { UserProfile } from '@ypm/shared'
import { Route, Routes } from 'react-router'
import Landing from './components/Landing'
import Loading from './components/Loading'
import { request } from './lib/request'
import Layout from './routes/Layout'
import PlaylistDetail from './routes/playlist'
import Playlists from './routes/playlists'

export default function App() {
  const { data: me = null, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => request<UserProfile | null>('/auth/me')
  })

  if (isLoading) return <Loading />
  if (!me) return <Landing />
  return (
    <Routes>
      <Route element={<Layout user={me} />}>
        <Route index element={<Playlists />} />
        <Route path="playlist/:id" element={<PlaylistDetail />} />
      </Route>
    </Routes>
  )
}

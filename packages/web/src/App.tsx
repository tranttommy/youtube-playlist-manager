import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await fetch('/auth/me')).json()
  })

  const incrementCounter = useMutation({
    mutationFn: async (c: number) => {
      const res = await fetch(`/api/counter/${c}`)
      if (!res.ok) throw await res.json()
      return res.json()
    },
    onSuccess: data => setCount(data.count),
    onError: error => console.error(error.message)
  })

  if (incrementCounter.error)
    return <h1>Error: {incrementCounter.error.message}</h1>

  return isLoading ? (
    <h1>LOADING</h1>
  ) : (
    <section id="center">
      <div className="hero">
        <img src={heroImg} className="base" width="170" height="179" alt="" />
        <img src={reactLogo} className="framework" alt="React logo" />
        <img src={viteLogo} className="vite" alt="Vite logo" />
      </div>
      <div>
        <h1>
          Hello{me && ' '}
          {me?.name}!
        </h1>
        <p>
          Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
        </p>
      </div>
      <button
        className="counter"
        onClick={() => incrementCounter.mutate(count)}
        type="button"
      >
        {incrementCounter.isPending ? 'Loading...' : `Count is ${count}`}
      </button>
      {me ? (
        <a className="counter" href="/auth/logout">
          Log out
        </a>
      ) : (
        <a className="counter" href="/auth/login">
          Log in with Google
        </a>
      )}
    </section>
  )
}

export default App

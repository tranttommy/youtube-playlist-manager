import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  const mutation = useMutation({
    mutationFn: async (c: number) => {
      const res = await fetch(`/api/counter/${c}`)
      if (!res.ok) throw await res.json()
      return res.json()
    },
    onSuccess: data => setCount(data.count),
    onError: error => console.error(error.message)
  })

  if (mutation.error) return <h1>Error: {mutation.error.message}</h1>

  return (
    <section id="center">
      <div className="hero">
        <img src={heroImg} className="base" width="170" height="179" alt="" />
        <img src={reactLogo} className="framework" alt="React logo" />
        <img src={viteLogo} className="vite" alt="Vite logo" />
      </div>
      <div>
        <h1>Get started</h1>
        <p>
          Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
        </p>
      </div>
      <button
        className="counter"
        onClick={() => mutation.mutate(count)}
        type="button"
      >
        {mutation.isPending ? 'Loading...' : `Count is ${count}`}
      </button>
    </section>
  )
}

export default App

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { Toaster, toast } from 'sonner'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  },
  queryCache: new QueryCache({
    onError: ({ message }) => toast.error(message)
  }),
  mutationCache: new MutationCache({
    onError: ({ message }) => toast.error(message)
  })
})

// biome-ignore lint/style/noNonNullAssertion: Assumed to exist
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster theme="dark" position="bottom-right" />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)

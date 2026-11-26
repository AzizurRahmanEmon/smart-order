import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'

import { createQueryClient } from '@/lib/queryClient'

import './index.css'
import App from './App.tsx'

const queryClient = createQueryClient()

const mswEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW === 'true'

;(window as unknown as { __SO_QUERY__?: typeof queryClient }).__SO_QUERY__ =
  queryClient

if (mswEnabled) {
  window.addEventListener(
    'msw:ready',
    () => {
      void queryClient.invalidateQueries()
    },
    { once: true },
  )
}

const root = createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
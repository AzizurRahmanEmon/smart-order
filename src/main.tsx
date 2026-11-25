import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'

import { createQueryClient } from '@/lib/queryClient'

import './index.css'
import App from './App.tsx'

const queryClient = createQueryClient()

async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV) return
  const { worker } = await import('./mocks/browser')
  await worker.start()
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
})
import { QueryClient } from '@tanstack/react-query'

const devOrMswPreview =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW === 'true'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: devOrMswPreview ? 2 : false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
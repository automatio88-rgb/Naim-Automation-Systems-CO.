import { QueryClient } from '@tanstack/react-query'
import { realtimeEnabled } from './supabase'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 8_000,
      // Production: Supabase Realtime pushes changes. Preview: poll so Hermes activity still streams in.
      refetchInterval: realtimeEnabled ? false : 15_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})
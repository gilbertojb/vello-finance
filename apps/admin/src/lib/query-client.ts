import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

// Instância server-side (uma por request via React.cache()).
// staleTime deve ser igual ao QueryClient de providers.tsx para evitar re-fetch imediato no hydrate.
export const getQueryClient = cache(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60 * 1000 },
      },
    }),
)

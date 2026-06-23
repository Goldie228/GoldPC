import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'          // Новые прототипные tokens + Tailwind (первый!)
import './styles/globals.css'
import './styles/staff.css'
import App from './App.tsx'
import { catalogApi } from './api/catalog'
import { categoriesKeys } from './hooks/useCategories'

// Lazy load React Query DevTools - only in development and only when needed
const ReactQueryDevtools = lazy(() => 
  import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools }))
)

// DevTools must never "leak" into the premium UI by default.
// Enable explicitly via Vite env var: VITE_ENABLE_QUERY_DEVTOOLS=true
const enableReactQueryDevtools =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_QUERY_DEVTOOLS === 'true'

// Создаем QueryClient с настройками по умолчанию
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
      gcTime: 24 * 60 * 60 * 1000, // 24 часа кэширования
      retry: 1, // Одна попытка повторного запроса при ошибке
      refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    },
    mutations: {
      retry: 3, // 3 попытки повторного запроса при ошибке мутации
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

// Prefetch categories at startup — they're used on every page
queryClient.prefetchQuery({
  queryKey: categoriesKeys.list(),
  queryFn: () => catalogApi.getCategories(),
  staleTime: 10 * 60 * 1000,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {enableReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  </StrictMode>,
)

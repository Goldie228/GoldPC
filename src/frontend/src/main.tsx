import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/globals.css'
import './styles/staff.css'
import './index.css'
import App from './App.tsx'
import { performanceMonitor } from './utils/performance'

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
      gcTime: 5 * 60 * 1000, // 5 минут - время жизни в кэше (ранее cacheTime)
      retry: 1, // Одна попытка повторного запроса при ошибке
      refetchOnWindowFocus: false, // Не обновлять при фокусе окна
    },
    mutations: {
      retry: 1, // Одна попытка повторного запроса при ошибке мутации
    },
  },
})

async function enableMocking() {
  // Пропускаем MSW если нужны реальные данные (VITE_USE_REAL_API=true)
  if (import.meta.env.VITE_USE_REAL_API === 'true') {
    return
  }
  // Включаем MSW только в режиме разработки
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    return worker.start({
      onUnhandledRequest: 'bypass',
    })
  }
}

// Инициализация мониторинга производительности
// Монитор автоматически начинает сбор Core Web Vitals при импорте
// В режиме разработки проверяем бюджеты при загрузке страницы
const enablePerformanceBudgetChecks =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_PERFORMANCE_BUDGET_CHECKS === 'true'

if (enablePerformanceBudgetChecks) {
  window.addEventListener('load', () => {
    // Даём время на сбор метрик
    setTimeout(() => {
      const result = performanceMonitor.checkBudgets()
      if (!result.passed) {
        console.warn(
          '[Performance] Budget violations detected on page load:',
          result.violations
        )
      }
    }, 3000)
  })
}

enableMocking().then(() => {
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
})

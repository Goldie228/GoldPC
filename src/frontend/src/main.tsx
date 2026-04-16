import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource-variable/fraunces/index.css'
import 'leaflet/dist/leaflet.css'
import './styles/tokens.css'
import './styles/globals.css'
import './styles/staff.css'
import './index.css'
import App from './App.tsx'
import { performanceMonitor } from './utils/performance'
import { initializePWA } from './lib/pwa'

// Initialize PWA service worker
initializePWA()

// Lazy load React Query DevTools - only in development and only when needed
const ReactQueryDevtools = lazy(() => 
  import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools }))
)

// DevTools must never "leak" into the premium UI by default.
// Enable explicitly via Vite env var: VITE_ENABLE_QUERY_DEVTOOLS=true
const enableReactQueryDevtools =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_QUERY_DEVTOOLS === 'true'

// Создаем QueryClient с настройками по умолчанию + PWA оффлайн поддержка
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут - данные считаются свежими
      gcTime: 24 * 60 * 60 * 1000, // 24 часа для оффлайн доступа
      retry: 1, // Одна попытка повторного запроса при ошибке
      refetchOnWindowFocus: false, // Не обновлять при фокусе окна
      networkMode: 'offlineFirst' // Оффлайн-first режим для PWA
    },
    mutations: {
      retry: 3, // 3 попытки повторного запроса при ошибке мутации
      networkMode: 'offlineFirst',
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})

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

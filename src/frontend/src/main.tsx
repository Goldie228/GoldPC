import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './styles/globals.css'
import './index.css'
import App from './App.tsx'
import { performanceMonitor } from './utils/performance'

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
  // Включаем MSW только в режиме разработки
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    
    // Запускаем worker
    return worker.start({
      onUnhandledRequest: 'bypass', // Пропускаем необработанные запросы
    })
  }
}

// Инициализация мониторинга производительности
// Монитор автоматически начинает сбор Core Web Vitals при импорте
// В режиме разработки проверяем бюджеты при загрузке страницы
if (import.meta.env.DEV) {
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
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>,
  )
})

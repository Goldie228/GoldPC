import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { performanceMonitor } from './utils/performance'

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
      <App />
    </StrictMode>,
  )
})

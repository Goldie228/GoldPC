import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

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

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

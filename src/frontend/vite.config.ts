import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Исправление для путей с символом #
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Разрешаем доступ к файловой системе для родительских директорий
  server: {
    host: true,
    watch: {
      // Используем polling для надежности при синхронизации через rsync
      usePolling: true,
      interval: 100,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  // Настройки для сборки с оптимизацией производительности
  build: {
    // Используем относительные пути в сборке
    assetsDir: 'assets',
    // Оптимизация чанков для лучшего FCP/LCP
    rollupOptions: {
      output: {
        // Разделение чанков по вендорам для оптимизации загрузки
        manualChunks(id) {
          // React core - критически важен, загружается первым
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          // React Query - для работы с данными
          if (id.includes('node_modules/@tanstack/react-query/')) {
            return 'react-query';
          }
          // UI библиотеки - загружаются асинхронно
          if (id.includes('node_modules/framer-motion/') || 
              id.includes('node_modules/lucide-react/')) {
            return 'ui-vendor';
          }
          // Утилиты
          if (id.includes('node_modules/axios/') || 
              id.includes('node_modules/dompurify/') || 
              id.includes('node_modules/zustand/') || 
              id.includes('node_modules/web-vitals/')) {
            return 'utils';
          }
        },
      },
    },
    // Увеличиваем предупреждение о размере чанка
    chunkSizeWarningLimit: 500,
  },
  // Оптимизация зависимостей для dev режима
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
    // Исключаем dev-tools из предзагрузки
    exclude: ['@tanstack/react-query-devtools'],
  },
})

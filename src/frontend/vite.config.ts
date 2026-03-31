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
      'leaflet': path.resolve(__dirname, '../../node_modules/leaflet'),
    },
  },
  // Разрешаем доступ к файловой системе для родительских директорий
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      // Используем polling для надежности при синхронизации через rsync
      usePolling: true,
      interval: 100,
    },
    proxy: {
      '/api/v1/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/v1/address': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/v1/wishlist': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/api/v1/orders': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
      '/api/v1/promo': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
      '/api/v1/pcbuilder': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
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
          if (id.includes('node_modules/framer-motion/')) {
            return 'framer-motion';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'lucide-icons';
          }
          // MUI и другие тяжелые UI библиотеки (если будут добавлены)
          if (id.includes('node_modules/@mui/')) {
            return 'mui-vendor';
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

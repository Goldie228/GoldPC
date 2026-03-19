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
    fs: {
      strict: false,
      allow: [
        // Разрешаем текущую директорию
        '..',
        // Разрешаем все родительские директории (важно для путей с #)
        path.resolve(__dirname, '../../..'),
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  // Настройки для сборки
  build: {
    // Используем относительные пути в сборке
    assetsDir: 'assets',
  },
})

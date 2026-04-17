import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // VitePWA temporarily disabled - install vite-plugin-pwa package to enable
  ],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'leaflet': path.resolve(__dirname, '../../node_modules/leaflet'),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
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
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@tanstack/react-query/')) {
            return 'react-query';
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'framer-motion';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'lucide-icons';
          }
          if (id.includes('node_modules/@mui/')) {
            return 'mui-vendor';
          }
          if (id.includes('node_modules/axios/') ||
              id.includes('node_modules/dompurify/') ||
              id.includes('node_modules/zustand/') ||
              id.includes('node_modules/web-vitals/')) {
            return 'utils';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
    exclude: ['@tanstack/react-query-devtools'],
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // VitePWA temporarily disabled - install vite-plugin-pwa package to enable
  ],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
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
      '/api/v1/Auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
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
      '/api/v1/services': {
        target: 'http://localhost:5003',
        changeOrigin: true,
      },
      '/api/v1/Services': {
        target: 'http://localhost:5003',
        changeOrigin: true,
      },
      '/api/v1/catalog': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/v1/Catalog': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/v1/pcbuilder': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
      '/api/v1/warranty': {
        target: 'http://localhost:5004',
        changeOrigin: true,
      },
      '/hubs/chat': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        ws: true,
      },
      '/hubs/notifications': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        ws: true,
      },
      '/api/v1/admin': {
        target: 'http://localhost:5007',
        changeOrigin: true,
      },
      '/api/v1/notifications': {
        target: 'http://localhost:5007',
        changeOrigin: true,
      },
      '/api/v1/feedback': {
        target: 'http://localhost:5007',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads/avatars': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    cssMinify: false,
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
          // Leaflet + react-leaflet — map rendering (only needed on contacts/checkout pages)
          if (id.includes('node_modules/leaflet/') ||
              id.includes('node_modules/react-leaflet/') ||
              id.includes('node_modules/@react-leaflet/')) {
            return 'leaflet';
          }
          // jsPDF + autoTable — PDF export (only needed when user exports PC build)
          if (id.includes('node_modules/jspdf/') ||
              id.includes('node_modules/jspdf-autotable/')) {
            return 'pdf-export';
          }
          // Fontsource fonts — loaded on startup but separable
          if (id.includes('node_modules/@fontsource/')) {
            return 'fonts';
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

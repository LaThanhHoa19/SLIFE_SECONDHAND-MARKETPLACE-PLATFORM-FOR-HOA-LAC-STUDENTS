import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Trong Docker, backend là service `backend:8080`; trên máy host dùng localhost.
const backendProxyTarget =
    process.env.BACKEND_PROXY_TARGET || 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis'
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100
    },
    hmr: {
      host: "localhost",
      protocol: "ws"
    },
    proxy: {
      '/maps': {
        target: 'https://maps.vietmap.vn',
        changeOrigin: true
      },
      '/api': {
        target: backendProxyTarget,
        changeOrigin: true,
      },
      '/chat': {
        target: backendProxyTarget,
        ws: true,
        changeOrigin: true,
        bypass(req) {
          const path = req.url?.split('?')[0] ?? ''
          const accept = req.headers.accept ?? ''
          if (path === '/chat' && accept.includes('text/html')) {
            return '/index.html'
          }
        },
      },
    }
  }
})

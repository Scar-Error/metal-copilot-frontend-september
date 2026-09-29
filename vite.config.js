import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy target for local development. The local Django dev server runs on
    // 127.0.0.1:8085 (runserver 8085) — this used to point at port 8000, which is
    // why proxied requests failed to connect locally.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8085',
        changeOrigin: true,
      }
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      // Only proxy backend auth routes, not frontend auth routes
      '/auth/google': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/auth/github': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/auth/logout': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/auth/debug': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      }
      // Note: /auth/callback is NOT proxied - handled by React Router
    }
  },
  build: {
    outDir: 'dist', // default is dist, but explicitly set
  }
})

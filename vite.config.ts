import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // AI Tutor berjalan di server terpisah supaya API key tidak pernah
      // sampai ke browser anak.
      '/api': 'http://localhost:8787',
    },
  },
})

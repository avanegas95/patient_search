import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Requests to /api are forwarded to the Flask server, so the browser only ever
// talks to one origin and there is no CORS setup to worry about.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
})

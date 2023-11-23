import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5066
  },
  plugins: [
    react({
      exclude: '**/*.tsx'
    })
  ]
})

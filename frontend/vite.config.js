import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'vendor'
          if (id.includes('node_modules/recharts')) return 'charts'
          if (id.includes('node_modules/framer-motion')) return 'motion'
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/react-hot-toast')) return 'forms'
        },
      },
    },
  },
})
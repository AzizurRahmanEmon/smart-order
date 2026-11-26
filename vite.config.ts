import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(rootDir, './src') },
  },
  server: {
    warmup: {
      clientFiles: [
        './index.html',
        './src/main.tsx',
        './src/App.tsx',
        './src/msw-bootstrap.ts',
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@google/genai')) return 'genai'
          if (!id.includes('node_modules')) return undefined
          if (
            id.includes('react-dom') ||
            id.includes('/react/') ||
            id.includes('scheduler')
          ) {
            return 'react-vendor'
          }
          if (id.includes('@tanstack/react-query')) return 'query'
          if (id.includes('radix-ui') || id.includes('@radix-ui')) return 'radix'
          return 'vendor'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
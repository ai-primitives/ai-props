/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5050,
    strictPort: true
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ai-props',
      formats: ['es', 'umd'],
      fileName: (format) => `ai-props.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'ai', '@ai-sdk/openai', 'clsx', 'tailwind-merge'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          ai: 'ai',
          '@ai-sdk/openai': 'aiSdkOpenai',
          clsx: 'clsx',
          'tailwind-merge': 'tailwindMerge'
        }
      }
    }
  },
  optimizeDeps: {
    include: ['ai', '@ai-sdk/openai', 'clsx', 'tailwind-merge']
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
})

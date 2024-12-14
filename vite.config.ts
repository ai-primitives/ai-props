/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ai-props',
      fileName: (format) => `ai-props.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'ai', '@ai-sdk/openai'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          ai: 'ai',
          '@ai-sdk/openai': 'aiSdkOpenai'
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  },
  server: {
    port: 5050,
    strictPort: true
  }
})

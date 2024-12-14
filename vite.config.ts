/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ai-sdk/provider': resolve(__dirname, 'node_modules/@ai-sdk/provider')
    }
  },
  optimizeDeps: {
    include: ['@ai-sdk/provider']
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ai-props',
      fileName: (format) => `ai-props.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'ai', '@ai-sdk/openai', '@ai-sdk/provider'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          ai: 'ai',
          '@ai-sdk/openai': 'aiSdkOpenai',
          '@ai-sdk/provider': 'aiSdkProvider'
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  }
})

/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic'
    })
  ],
  resolve: {
    alias: {
      '@ai-sdk/provider': resolve(__dirname, 'node_modules/@ai-sdk/provider'),
      'react': resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom')
    }
  },
  optimizeDeps: {
    include: ['@ai-sdk/provider', 'react', 'react-dom']
  },
  server: {
    port: 5001,
    strictPort: true,
    hmr: {
      port: 5001,
      clientPort: 5000
    }
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

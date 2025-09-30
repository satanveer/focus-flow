import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          react: ['react', 'react-dom', 'react-router-dom'],
          // Charts chunk - separate heavy visualization library
          charts: ['recharts']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})

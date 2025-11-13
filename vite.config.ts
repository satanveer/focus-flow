import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
          charts: ['recharts'],
          // Icons chunk
          icons: ['lucide-react']
        },
        // Better cache control with content hashing
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js',
      }
    },
    chunkSizeWarningLimit: 1000,
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Source maps for production debugging (optional - set to false for smaller builds)
    sourcemap: false,
  },
  // Performance hints
  server: {
    hmr: {
      overlay: true,
    },
  },
})

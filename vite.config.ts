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
    // Minification with security-focused options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove all console.* calls in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      },
      format: {
        comments: false // Remove all comments
      }
    },
    // Source maps for production debugging (set to false for smaller builds)
    sourcemap: false,
  },
  // Performance hints
  server: {
    hmr: {
      overlay: true,
    },
  },
})

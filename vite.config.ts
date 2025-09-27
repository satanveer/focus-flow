import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Enforce single React copy in case parent workspace has another
      react: '/Users/tanveer/Documents/Projects:Coding/ReactJs/Learn/focusflow/node_modules/react',
      'react-dom': '/Users/tanveer/Documents/Projects:Coding/ReactJs/Learn/focusflow/node_modules/react-dom'
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'recharts']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})

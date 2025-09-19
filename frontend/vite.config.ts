import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  
  plugins: [react(),
      tailwindcss(),
      
  ],

  server: {
    // This proxy rule will forward any requests that start with '/api'
    // (like your POST to '/api/reports') to your backend server running
    // on http://localhost:3001.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true, // This is important for some hosts to work correctly
        rewrite: (path) => path.replace(/^\/api/, ''), // This rewrites the path to remove the '/api' prefix
      },
    },
  },
})

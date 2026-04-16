import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
<<<<<<< HEAD
    host: '0.0.0.0',
=======
    host: '127.0.0.1',
>>>>>>> ededbe3af115e3ec434f825a693e25cafd376815
    port: 3000,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
})

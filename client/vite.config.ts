import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // When the backend is ready, requests to /api go to it during development.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});

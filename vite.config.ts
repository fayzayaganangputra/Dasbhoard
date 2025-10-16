import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ✅ Base harus sama dengan nama repository GitHub kamu persis
export default defineConfig({
  base: '/Dasbhoard/', // 🟢 sesuai dengan repo GitHub kamu
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173, // optional, defaultnya Vite
  },
});

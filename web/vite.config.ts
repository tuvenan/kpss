import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  envDir: '../', // Kök dizindeki .env dosyasını oku
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'], // EXPO_PUBLIC_ değişkenlerini web tarafında da tanı
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    target: 'esnext',
    sourcemap: true
  },
  resolve: {
    alias: {
      'shared': path.resolve(__dirname, '../shared/src')
    }
  },
  optimizeDeps: {
    include: ['@babylonjs/core', '@babylonjs/loaders']
  }
});
